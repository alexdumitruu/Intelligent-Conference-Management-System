import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  StreamableFile,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Paper } from './entities/paper.entity';
import { PaperHistory } from './entities/paper-history.entity';
import { PaperStatus } from './entities/paper-history.entity';
import { PaperAuthor } from './entities/paper-author.entity';
import { Review } from '../reviews/entities/review.entity';
import { Conference } from '../conferences/entities/conference.entity';
import {
  ConferenceRole,
  ConferenceRoleType,
} from '../conferences/entities/conference-role.entity';
import { User } from '../users/entities/user.entity';
import { VALID_STATUS_TRANSITIONS } from './paper-status-transitions';
import { SubmitRebuttalDto } from './dto/submit-rebuttal.dto';
import { FinalizeDecisionDto } from './dto/finalize-decision.dto';
import { MailService } from '../mail/mail.service';
import { Bid } from '../matching/entities/bid.entity';
import { Conflict } from '../matching/entities/conflict.entity';
import { CitationReport } from '../citations/entities/citation-report.entity';

import * as fs from 'fs';

@Injectable()
export class PapersService {
  constructor(
    @InjectModel(Paper)
    private readonly paperModel: typeof Paper,
    @InjectModel(PaperHistory)
    private readonly paperHistoryModel: typeof PaperHistory,
    private readonly mailService: MailService,
  ) {}

  async findAll(conferenceId: number): Promise<Paper[]> {
    return this.paperModel.findAll({ where: { conferenceId } });
  }

  async createPaper(
    title: string,
    abstract: string,
    conferenceId: number,
  ): Promise<Paper> {
    return this.paperModel.create({
      title,
      abstract,
      conferenceId,
      status: PaperStatus.DRAFT,
      pdfPath: null,
      extractedText: null,
    });
  }

  async processSubmission(
    paperId: number,
    file: Express.Multer.File,
    userId: number,
  ): Promise<Paper> {
    const paper = await this.paperModel.findByPk(paperId);
    if (!paper) {
      throw new NotFoundException(`Paper with ID ${paperId} not found`);
    }
    if (paper.status !== PaperStatus.DRAFT) {
      throw new BadRequestException(
        'Paper must be in DRAFT status to be submitted',
      );
    }
    const pdfPath = file.path;
    const extractedText = await this.extractTextFromPdf(pdfPath);
    paper.pdfPath = pdfPath;
    paper.extractedText = extractedText;
    await paper.save();
    const modifiedStatusPaper = await this.transitionState(
      paperId,
      PaperStatus.SUBMITTED,
      userId,
    );
    paper.status = modifiedStatusPaper.status;
    return paper;
  }

  async extractTextFromPdf(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    try {
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: dataBuffer });
      const data = await parser.getText();
      return data.text;
    } catch (error) {
      console.error('PDF PARSE ERROR:', error);
      throw new BadRequestException(`Cannot extract text from PDF`);
    }
  }

  async transitionState(
    paperId: number,
    targetStatus: PaperStatus,
    userId: number,
  ): Promise<Paper> {
    const paper = await this.paperModel.findByPk(paperId);
    if (!paper) {
      throw new NotFoundException(`Paper with ID ${paperId} not found`);
    }
    if (!VALID_STATUS_TRANSITIONS[paper.status].includes(targetStatus)) {
      throw new BadRequestException('Invalid status transition');
    }
    const previousStatus = paper.status;
    paper.status = targetStatus;
    await paper.save();
    await this.paperHistoryModel.create({
      paperId,
      userId,
      previousState: previousStatus,
      newState: targetStatus,
      timestamp: new Date(),
    });
    return paper;
  }

  checkDeadlineConstraint(deadline: Date): void {
    if (new Date() > new Date(deadline)) {
      throw new BadRequestException('The deadline for this action has passed');
    }
  }

  async getPaperPdfStream(
    paperId: number,
    userId: number,
    conferenceId: number,
  ): Promise<StreamableFile> {
    const paper = await this.paperModel.findByPk(paperId);
    if (!paper) {
      throw new NotFoundException(`Paper with ID ${paperId} not found`);
    }

    const isReviewer = await Review.findOne({ where: { paperId, userId } });
    const isChair = await ConferenceRole.findOne({
      where: { userId, conferenceId, roleType: ConferenceRoleType.CHAIR },
    });
    const isAuthor = await PaperAuthor.findOne({ where: { paperId, userId } });

    if (!isReviewer && !isChair && !isAuthor) {
      throw new ForbiddenException('You do not have access to this PDF');
    }

    if (!paper.pdfPath || !fs.existsSync(paper.pdfPath)) {
      throw new NotFoundException('PDF file not found on disk');
    }

    const stream = fs.createReadStream(paper.pdfPath);
    return new StreamableFile(stream, {
      type: 'application/pdf',
      disposition: 'inline',
    });
  }

  async submitRebuttal(
    paperId: number,
    userId: number,
    dto: SubmitRebuttalDto,
  ): Promise<Paper> {
    const paper = await this.paperModel.findByPk(paperId);
    if (!paper) {
      throw new NotFoundException(`Paper with ID ${paperId} not found`);
    }

    if (paper.status !== PaperStatus.DISCUSSION) {
      throw new BadRequestException(
        'Paper must be in DISCUSSION status to submit a rebuttal',
      );
    }

    const authorRecord = await PaperAuthor.findOne({
      where: { paperId, userId },
    });
    if (!authorRecord) {
      throw new ForbiddenException('Only authors can submit a rebuttal');
    }

    const conference = await Conference.findByPk(paper.conferenceId);
    if (conference) {
      this.checkDeadlineConstraint(conference.discussionDeadline);
    }

    paper.rebuttalText = dto.rebuttalText;
    await paper.save();
    return paper;
  }

  async finalizeDecision(
    paperId: number,
    dto: FinalizeDecisionDto,
    userId: number,
  ): Promise<Paper> {
    if (
      dto.decision !== PaperStatus.ACCEPTED &&
      dto.decision !== PaperStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Decision must be either ACCEPTED or REJECTED',
      );
    }

    const paper = await this.paperModel.findByPk(paperId, {
      include: [Conference, { model: PaperAuthor, include: [User] }],
    });
    if (!paper) {
      throw new NotFoundException(`Paper with ID ${paperId} not found`);
    }

    const updatedPaper = await this.transitionState(
      paperId,
      dto.decision,
      userId,
    );

    if (paper.authors) {
      for (const author of paper.authors) {
        if (author.user?.email) {
          await this.mailService.sendDecisionEmail(
            author.user.email,
            author.user.firstName,
            paper.title,
            dto.decision,
            paper.conference?.title || 'Conference',
          );
        }
      }
    }

    return updatedPaper;
  }

  async getReviewerPaperDetails(
    conferenceId: number,
    paperId: number,
  ): Promise<Paper> {
    const conference = await Conference.findByPk(conferenceId);
    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

    const dynamicInclude: any[] = [];
    if (!conference.isDoubleBlind) {
      dynamicInclude.push({
        model: PaperAuthor,
        include: [
          {
            model: User,
            attributes: ['id', 'firstName', 'lastName', 'affiliation'],
          },
        ],
      });
    }

    const paper = await this.paperModel.findByPk(paperId, {
      attributes: [
        'id',
        'title',
        'abstract',
        'keywords',
        'topics',
        'status',
        'createdAt',
      ],
      include: dynamicInclude,
    });

    if (!paper || paper.conferenceId !== conferenceId) {
      throw new NotFoundException('Paper not found in this conference');
    }

    return paper;
  }

  async getChairMasterTable(conferenceId: number): Promise<Paper[]> {
    return this.paperModel.findAll({
      where: { conferenceId },
      include: [
        {
          model: PaperAuthor,
          include: [
            {
              model: User,
              attributes: [
                'id',
                'firstName',
                'lastName',
                'email',
                'affiliation',
              ],
            },
          ],
        },
        {
          model: Review,
          attributes: ['id', 'userId', 'score', 'confidence', 'contentChair'],
          include: [
            { model: User, attributes: ['id', 'firstName', 'lastName'] },
          ],
        },
        {
          model: Bid,
          attributes: ['id', 'userId', 'bidType'],
          include: [
            { model: User, attributes: ['id', 'firstName', 'lastName'] },
          ],
        },
        {
          model: Conflict,
          attributes: ['id', 'userId', 'reason'],
          include: [
            { model: User, attributes: ['id', 'firstName', 'lastName'] },
          ],
        },
        {
          model: CitationReport,
          attributes: [
            'id',
            'totalCitations',
            'verifiedCitations',
            'flaggedErrors',
            'extractionMethod',
          ],
        },
      ],
      order: [['id', 'ASC']],
    });
  }
}

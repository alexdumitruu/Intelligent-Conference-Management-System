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
    userId: number,
    keywords?: string[],
    topics?: string[],
    coAuthorIds?: number[],
  ): Promise<Paper> {
    const conference = await Conference.findByPk(conferenceId);
    if (!conference) {
      throw new NotFoundException('Conference not found');
    }
    this.checkDeadlineConstraint(conference.submissionDeadline);

    const paper = await this.paperModel.create({
      title,
      abstract,
      conferenceId,
      keywords,
      topics,
      status: PaperStatus.DRAFT,
      pdfPath: null,
      extractedText: null,
    });

    await PaperAuthor.create({ paperId: paper.id, userId, authorOrder: 1 });
    // Add co-authors
    if (coAuthorIds && coAuthorIds.length > 0) {
      const uniqueCoAuthors = [...new Set(coAuthorIds)].filter(
        (id) => id !== userId,
      );
      for (let i = 0; i < uniqueCoAuthors.length; i++) {
        const coAuthorUser = await User.findByPk(uniqueCoAuthors[i]);
        if (!coAuthorUser) {
          throw new NotFoundException(
            `User with ID ${uniqueCoAuthors[i]} not found`,
          );
        }
        await PaperAuthor.create({
          paperId: paper.id,
          userId: uniqueCoAuthors[i],
          authorOrder: i + 2,
        });
        const existingRole = await ConferenceRole.findOne({
          where: {
            conferenceId,
            userId: uniqueCoAuthors[i],
            roleType: ConferenceRoleType.AUTHOR,
          },
        });
        if (!existingRole) {
          await ConferenceRole.create({
            conferenceId,
            userId: uniqueCoAuthors[i],
            roleType: ConferenceRoleType.AUTHOR,
          });
        }
      }
    }
    return paper;
  }

  async processSubmission(
    paperId: number,
    file: Express.Multer.File,
    userId: number,
  ): Promise<Paper> {
    if (!file || !file.path) {
      throw new BadRequestException('PDF file is required for submission');
    }

    const paper = await this.paperModel.findByPk(paperId);
    if (!paper) {
      throw new NotFoundException(`Paper with ID ${paperId} not found`);
    }
    if (paper.status !== PaperStatus.DRAFT) {
      throw new BadRequestException(
        'Paper must be in DRAFT status to be submitted',
      );
    }
    const conference = await Conference.findByPk(paper.conferenceId);
    if (conference) {
      this.checkDeadlineConstraint(conference.submissionDeadline);
    }

    try {
      // Save pdfPath FIRST so the file is linked even if text extraction fails
      const pdfPath = file.path;
      paper.pdfPath = pdfPath;
      paper.extractedText = await this.extractTextFromPdf(pdfPath);
      await paper.save();

      const modifiedStatusPaper = await this.transitionState(
        paperId,
        PaperStatus.SUBMITTED,
        userId,
      );
      paper.status = modifiedStatusPaper.status;
      return paper;
    } catch (err) {
      console.error('Submit Failed internally:', err);
      throw err;
    }
  }

  async extractTextFromPdf(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: dataBuffer });
      const data = await parser.getText();
      return data.text || '';
    } catch (error) {
      console.error('PDF PARSE ERROR (non-fatal, PDF still saved):', error);
      return '';
    }
  }

  async deleteDraft(paperId: number, userId: number): Promise<void> {
    const paper = await this.paperModel.findByPk(paperId);
    if (!paper) {
      throw new NotFoundException(`Paper with ID ${paperId} not found`);
    }
    if (paper.status !== PaperStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT papers can be deleted');
    }
    const authorRecord = await PaperAuthor.findOne({
      where: { paperId, userId },
    });
    if (!authorRecord) {
      throw new ForbiddenException('Only authors can delete their papers');
    }
    // Clean up PDF file if it exists
    if (paper.pdfPath && fs.existsSync(paper.pdfPath)) {
      fs.unlinkSync(paper.pdfPath);
    }
    await PaperAuthor.destroy({ where: { paperId } });
    await this.paperHistoryModel.destroy({ where: { paperId } });
    await paper.destroy();
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

  async forceSetStatus(
    paperId: number,
    targetStatus: PaperStatus,
    userId: number,
  ): Promise<Paper> {
    const paper = await this.paperModel.findByPk(paperId);
    if (!paper) {
      throw new NotFoundException(`Paper with ID ${paperId} not found`);
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
        {
          model: PaperHistory,
          attributes: ['id', 'previousState', 'newState', 'timestamp'],
          include: [
            { model: User, attributes: ['id', 'firstName', 'lastName'] },
          ],
        },
      ],
      order: [['id', 'ASC']],
    });
  }

  async findByAuthor(conferenceId: number, userId: number): Promise<Paper[]> {
    const authorRecords = await PaperAuthor.findAll({ where: { userId } });
    const paperIds = authorRecords.map((a) => a.paperId);
    if (paperIds.length === 0) return [];
    return this.paperModel.findAll({
      where: { conferenceId, id: paperIds },
      include: [
        {
          model: PaperAuthor,
          as: 'authors',
          include: [
            {
              model: User,
              as: 'user',
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
      ],
    });
  }

  async addCoAuthor(
    paperId: number,
    userId: number,
    coAuthorUserId: number,
  ): Promise<PaperAuthor> {
    const paper = await this.paperModel.findByPk(paperId);
    if (!paper) {
      throw new NotFoundException(`Paper with ID ${paperId} not found`);
    }
    if (paper.status !== PaperStatus.DRAFT) {
      throw new BadRequestException('Can only add co-authors to DRAFT papers');
    }
    const isAuthor = await PaperAuthor.findOne({ where: { paperId, userId } });
    if (!isAuthor) {
      throw new ForbiddenException('Only existing authors can add co-authors');
    }
    const existing = await PaperAuthor.findOne({
      where: { paperId, userId: coAuthorUserId },
    });
    if (existing) {
      throw new BadRequestException('User is already an author on this paper');
    }
    const coAuthorUser = await User.findByPk(coAuthorUserId);
    if (!coAuthorUser) {
      throw new NotFoundException('Co-author user not found');
    }
    const maxOrder =
      ((await PaperAuthor.max('authorOrder', {
        where: { paperId },
      })) as number) || 0;
    return PaperAuthor.create({
      paperId,
      userId: coAuthorUserId,
      authorOrder: maxOrder + 1,
    });
  }

  async removeCoAuthor(
    paperId: number,
    userId: number,
    coAuthorUserId: number,
  ): Promise<void> {
    const paper = await this.paperModel.findByPk(paperId);
    if (!paper) {
      throw new NotFoundException(`Paper with ID ${paperId} not found`);
    }
    if (paper.status !== PaperStatus.DRAFT) {
      throw new BadRequestException(
        'Can only remove co-authors from DRAFT papers',
      );
    }
    const isAuthor = await PaperAuthor.findOne({ where: { paperId, userId } });
    if (!isAuthor) {
      throw new ForbiddenException(
        'Only existing authors can remove co-authors',
      );
    }
    if (userId === coAuthorUserId) {
      throw new BadRequestException('Cannot remove yourself as author');
    }
    const record = await PaperAuthor.findOne({
      where: { paperId, userId: coAuthorUserId },
    });
    if (!record) {
      throw new NotFoundException('Co-author not found on this paper');
    }
    await record.destroy();
  }
}

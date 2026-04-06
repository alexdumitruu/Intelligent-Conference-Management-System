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

  checkDeadlineConstraint(deadline: Date): void {}

  async getPaperPdfStream(
    paperId: number,
    userId: number,
    conferenceId: number,
  ): Promise<StreamableFile> {
    return {} as StreamableFile;
  }

  async submitRebuttal(
    paperId: number,
    userId: number,
    dto: SubmitRebuttalDto,
  ): Promise<Paper> {
    return {} as Paper;
  }

  async finalizeDecision(
    paperId: number,
    dto: FinalizeDecisionDto,
    userId: number,
  ): Promise<Paper> {
    return {} as Paper;
  }
}

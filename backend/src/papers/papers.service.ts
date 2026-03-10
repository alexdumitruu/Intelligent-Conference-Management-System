import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Paper } from './entities/paper.entity';
import { PaperHistory } from './entities/paper-history.entity';
import { PaperStatus } from './entities/paper-history.entity';
import { VALID_STATUS_TRANSITIONS } from './paper-status-transitions';
import * as fs from 'fs';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class PapersService {
  constructor(
    @InjectModel(Paper)
    private readonly paperModel: typeof Paper,
    @InjectModel(PaperHistory)
    private readonly paperHistoryModel: typeof PaperHistory,
  ) {}

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
      const data = await (pdfParse as any)(dataBuffer);
      return data.text;
    } catch (error) {
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
}

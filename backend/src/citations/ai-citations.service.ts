import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/sequelize';
import { firstValueFrom } from 'rxjs';
import { CitationReport } from './entities/citation-report.entity';
import { Paper } from '../papers/entities/paper.entity';
import { CitationsService } from './citations.service';
import { ExtractionMethod } from './extraction-method.enum';
import { XMLParser } from 'fast-xml-parser';
import FormData from 'form-data';
const GROBID_ENDPOINT = 'http://localhost:8070/api/processReferences';
interface FlaggedCitation {
  citationNumber: number;
  referenceText: string;
  reason: string;
}
@Injectable()
export class AiCitationsService {
  constructor(
    @InjectModel(CitationReport)
    private readonly citationReportModel: typeof CitationReport,
    @InjectModel(Paper)
    private readonly paperModel: typeof Paper,
    private readonly httpService: HttpService,
    private readonly citationsService: CitationsService,
  ) {}
  async processPdfWithGrobid(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<string> {
    const formData = new FormData();
    formData.append('input', fileBuffer, { filename });
    let response = null;
    try {
      response = await firstValueFrom(
        this.httpService.post(GROBID_ENDPOINT, formData, {
          headers: formData.getHeaders(),
          responseType: 'text',
        }),
      );
    } catch (error) {
      throw new BadRequestException('GROBID processing failed');
    }
    if (!response) {
      throw new BadRequestException('GROBID processing failed');
    }
    return response.data;
  }
  parseGrobidXml(teiXml: string): string[] {
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(teiXml);
    const listBibl = parsed?.TEI?.text?.back?.div?.listBibl;

    if (!listBibl || !listBibl.biblStruct) {
      return [];
    }
    const biblStructArr = Array.isArray(listBibl.biblStruct)
      ? listBibl.biblStruct
      : [listBibl.biblStruct];

    return biblStructArr.map((biblStruct: any) => {
      // Extract Title
      const rawTitle = biblStruct?.analytic?.title || biblStruct?.monogr?.title;
      const title =
        typeof rawTitle === 'object' && rawTitle['#text']
          ? rawTitle['#text']
          : rawTitle || 'Unknown Title';

      // Extract Year (Typically found in monogr.imprint.date)
      const rawDate = biblStruct?.monogr?.imprint?.date;
      const year =
        typeof rawDate === 'object'
          ? rawDate['#text']
            ? rawDate['#text']
            : rawDate['@_when'] || 'Unknown Year'
          : rawDate || 'Unknown Year';
      // Extract Author
      let author = 'Unknown Author';
      const rawAuthor =
        biblStruct?.analytic?.author || biblStruct?.monogr?.author;
      if (rawAuthor) {
        const firstAuthor = Array.isArray(rawAuthor) ? rawAuthor[0] : rawAuthor;
        if (firstAuthor?.persName?.surname) {
          const surname = firstAuthor.persName.surname;
          author =
            typeof surname === 'object' ? surname['#text'] || author : surname;
        } else if (firstAuthor?.orgName) {
          // Fallback for organizations
          author =
            typeof firstAuthor.orgName === 'object'
              ? firstAuthor.orgName['#text']
              : firstAuthor.orgName;
        }
      }
      return `${author}, ${title}, ${year}`;
    });
  }
  async generateAiCitationReport(
    paperId: number,
    fileBuffer: Buffer,
    filename: string,
  ): Promise<CitationReport> {
    const paper = await this.paperModel.findByPk(paperId);
    if (!paper) {
      throw new NotFoundException('Paper not found');
    }
    const teiXml = await this.processPdfWithGrobid(fileBuffer, filename);
    const references = this.parseGrobidXml(teiXml);

    const flaggedErrors: FlaggedCitation[] = [];
    let verifiedCitations = 0;

    for (let i = 0; i < references.length; i++) {
      const referenceText = references[i];
      const verificationResult =
        await this.citationsService.verifyReferenceWithCrossref(referenceText);
      if (verificationResult.isVerified) {
        verifiedCitations++;
      } else {
        flaggedErrors.push({
          citationNumber: i + 1,
          referenceText,
          reason: verificationResult.reason,
        });
      }
    }

    const oldReport = await this.citationReportModel.findOne({
      where: { paperId, extractionMethod: ExtractionMethod.AI },
    });
    if (oldReport) {
      await oldReport.destroy();
    }

    return this.citationReportModel.create({
      paperId,
      totalCitations: references.length,
      verifiedCitations,
      flaggedErrors,
      extractionMethod: ExtractionMethod.AI,
    });
  }

  async generateAiCitationReportFromStoredPdf(
    paperId: number,
  ): Promise<CitationReport> {
    const paper = await this.paperModel.findByPk(paperId);
    if (!paper) {
      throw new NotFoundException('Paper not found');
    }
    if (!paper.pdfPath) {
      throw new BadRequestException('Paper has no uploaded PDF');
    }
    const absolutePath = path.resolve(paper.pdfPath);
    const fileBuffer = fs.readFileSync(absolutePath);
    const filename = path.basename(absolutePath);
    return this.generateAiCitationReport(paperId, fileBuffer, filename);
  }
}

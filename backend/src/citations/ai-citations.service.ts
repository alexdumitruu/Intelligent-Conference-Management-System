import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
        typeof rawDate === 'object' && rawDate['#text']
          ? rawDate['#text']
          : rawDate || 'Unknown Year';

      // Extract Author (Can be complex in TEI, often an array of authors under analytic.author)
      // NEEDING TESTING, DEPENDING ON XML FORMAT
      let author = 'Unknown Author';
      const rawAuthor =
        biblStruct?.analytic?.author || biblStruct?.monogr?.author;
      if (rawAuthor) {
        // If it's an array of authors, just grab the first one for simplicity, or map them
        const firstAuthor = Array.isArray(rawAuthor) ? rawAuthor[0] : rawAuthor;
        const surname = firstAuthor?.persName?.surname;
        author =
          typeof surname === 'object' && surname['#text']
            ? surname['#text']
            : surname || author;
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

    return this.citationReportModel.create({
      paperId,
      totalCitations: references.length,
      verifiedCitations,
      flaggedErrors,
      extractionMethod: ExtractionMethod.AI,
    });
  }
}

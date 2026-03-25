import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/sequelize';
import { firstValueFrom } from 'rxjs';
import { CitationReport } from './entities/citation-report.entity';
import { Paper } from '../papers/entities/paper.entity';
import { ExtractionMethod } from './extraction-method.enum';

export const CROSSREF_CONFIDENCE_THRESHOLD = 35;

interface FlaggedCitation {
  citationNumber: number;
  referenceText: string;
  reason: string;
}

interface CrossrefVerificationResult {
  isVerified: boolean;
  reason: string;
}

@Injectable()
export class CitationsService {
  constructor(
    @InjectModel(CitationReport)
    private readonly citationReportModel: typeof CitationReport,
    @InjectModel(Paper)
    private readonly paperModel: typeof Paper,
    private readonly httpService: HttpService,
  ) {}
  // WE ONLY TAKE IEEE TYPE REFERENCES: [1], [2]
  parseBibliographyBlock(extractedText: string): string[] {
    const regexRef = /references\s*\n([\s\S]*)/i;
    const regexBib = /bibliography\s*\n([\s\S]*)/i;

    const regexRefMatch = regexRef.exec(extractedText);
    const regexBibMatch = regexBib.exec(extractedText);

    let bibliographyBlock = '';

    if (regexRefMatch !== null) {
      bibliographyBlock = regexRefMatch[1];
    } else if (regexBibMatch !== null) {
      bibliographyBlock = regexBibMatch[1];
    } else {
      throw new Error(
        'Could not find a References or Bibliography section in this PDF.',
      );
    }

    const regexCitation = /\[\d+\]\s*/;
    const citations = bibliographyBlock.split(regexCitation);

    return citations.filter((citation) => citation.trim().length > 0);
  }

  extractInlineCitations(extractedText: string): number[] {
    const regexInline = /\[(\d+)\]/g;
    const matches = extractedText.matchAll(regexInline);

    const parsedNumbers: number[] = [];

    for (const match of matches) {
      const citationNumber = parseInt(match[1], 10);
      parsedNumbers.push(citationNumber);
    }

    const uniqueCitations = Array.from(new Set(parsedNumbers));
    return uniqueCitations.sort((a, b) => a - b);
  }

  async verifyReferenceWithCrossref(
    referenceText: string,
  ): Promise<CrossrefVerificationResult> {
    const cleanedReferenceText = referenceText.trim().replace(/[\r\n]+/gm, ' ');
    const promise = firstValueFrom(
      this.httpService.get(
        `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(
          cleanedReferenceText,
        )}&rows=1`,
      ),
    );
    try {
      const response = await promise;
      const data = response.data.message.items;

      if (data.length === 0) {
        return { isVerified: false, reason: 'No results found in Crossref' };
      }
      const item = data[0];
      const matchScore = Math.round(item.score);
      if (item.score > CROSSREF_CONFIDENCE_THRESHOLD)
        return { isVerified: true, reason: `Match found (Score: ${matchScore})` };
      else return { isVerified: false, reason: `Low confidence (Score: ${matchScore})` };
    } catch (error) {
      return { isVerified: false, reason: 'Crossref API error' };
    }
  }

  async generateCitationReport(paperId: number): Promise<CitationReport> {
    const paper = await this.paperModel.findByPk(paperId);
    if (!paper) {
      throw new NotFoundException(`Paper with ID ${paperId} not found`);
    }
    if (!paper.extractedText) {
      throw new Error(`Paper with ID ${paperId} has no extracted text`);
    }
    const extractedText = paper.extractedText;
    const bibliographyBlock = this.parseBibliographyBlock(extractedText);
    const citedNumbers = this.extractInlineCitations(extractedText);

    const flaggedErrors: FlaggedCitation[] = [];
    let verifiedCitations = 0;
    for (const citation of citedNumbers) {
      if (citation > bibliographyBlock.length) {
        flaggedErrors.push({
          citationNumber: citation,
          referenceText: '',
          reason: 'Reference not found in bibliography',
        });
        continue;
      }
      const referenceText = bibliographyBlock[citation - 1];
      const verificationResult =
        await this.verifyReferenceWithCrossref(referenceText);
      if (verificationResult.isVerified) {
        verifiedCitations++;
      } else {
        flaggedErrors.push({
          citationNumber: citation,
          referenceText,
          reason: verificationResult.reason,
        });
      }
    }
    const oldReport = await this.citationReportModel.findOne({
      where: { paperId, extractionMethod: ExtractionMethod.REGEX },
    });
    if (oldReport) {
      await oldReport.destroy();
    }

    return this.citationReportModel.create({
      paperId,
      totalCitations: bibliographyBlock.length,
      verifiedCitations,
      flaggedErrors,
      extractionMethod: ExtractionMethod.REGEX,
    });
  }

  async getReportsByPaperId(paperId: number): Promise<CitationReport[]> {
    return this.citationReportModel.findAll({
      where: { paperId },
    });
  }
}

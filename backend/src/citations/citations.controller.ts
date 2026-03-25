import {
  Controller,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { CitationsService, CROSSREF_CONFIDENCE_THRESHOLD } from './citations.service';
import { AiCitationsService } from './ai-citations.service';
import { Roles } from '../common/decorators/roles.decorator';
import { ConferenceRoleGuard } from '../common/guards/conference-role.guard';
import { ConferenceRoleType } from '../conferences/entities/conference-role.entity';

@Controller('conferences/:conferenceId/papers/:paperId/citations')
@UseGuards(AuthGuard('jwt'), ConferenceRoleGuard)
export class CitationsController {
  constructor(
    private readonly citationsService: CitationsService,
    private readonly aiCitationsService: AiCitationsService,
  ) {}

  @Get()
  @Roles(ConferenceRoleType.CHAIR, ConferenceRoleType.AUTHOR)
  async getReportsByPaperId(@Param('paperId', ParseIntPipe) paperId: number) {
    const reports = await this.citationsService.getReportsByPaperId(paperId);
    return reports.map(r => ({ ...r.toJSON(), threshold: CROSSREF_CONFIDENCE_THRESHOLD }));
  }

  @Post('verify-regex')
  @Roles(ConferenceRoleType.CHAIR)
  async verifyCitationsRegex(@Param('paperId', ParseIntPipe) paperId: number) {
    const report = await this.citationsService.generateCitationReport(paperId);
    return { ...report.toJSON(), threshold: CROSSREF_CONFIDENCE_THRESHOLD };
  }

  @Post('verify-ai')
  @Roles(ConferenceRoleType.CHAIR)
  @UseInterceptors(FileInterceptor('file'))
  async verifyCitationsAi(
    @Param('paperId', ParseIntPipe) paperId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const report = await this.aiCitationsService.generateAiCitationReport(
      paperId,
      file.buffer,
      file.originalname,
    );
    return { ...report.toJSON(), threshold: CROSSREF_CONFIDENCE_THRESHOLD };
  }

  @Post('verify-ai-stored')
  @Roles(ConferenceRoleType.CHAIR)
  async verifyCitationsAiStored(
    @Param('paperId', ParseIntPipe) paperId: number,
  ) {
    const report = await this.aiCitationsService.generateAiCitationReportFromStoredPdf(paperId);
    return { ...report.toJSON(), threshold: CROSSREF_CONFIDENCE_THRESHOLD };
  }
}

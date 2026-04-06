import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  ParseIntPipe,
  Get,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { PapersService } from './papers.service';
import { PaperStatus } from './entities/paper-history.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { ConferenceRoleGuard } from '../common/guards/conference-role.guard';
import { ConferenceRoleType } from '../conferences/entities/conference-role.entity';
import { SubmitRebuttalDto } from './dto/submit-rebuttal.dto';
import { FinalizeDecisionDto } from './dto/finalize-decision.dto';
import { Response } from 'express';

@Controller('conferences/:conferenceId/papers')
@UseGuards(AuthGuard('jwt'))
export class PapersController {
  constructor(private readonly papersService: PapersService) {}

  @Get()
  async getPapers(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Req() req: any,
  ) {
    return this.papersService.findAll(conferenceId);
  }

  @Post()
  async createDraft(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() body: { title: string; abstract: string },
  ) {
    return this.papersService.createPaper(
      body.title,
      body.abstract,
      conferenceId,
    );
  }

  @Patch(':paperId/submit')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdfAndSubmit(
    @Param('paperId', ParseIntPipe) paperId: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.papersService.processSubmission(paperId, file, req.user.userId);
  }

  @Patch(':paperId/status')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.CHAIR)
  async updateState(
    @Param('paperId', ParseIntPipe) paperId: number,
    @Body() body: { targetStatus: PaperStatus },
    @Req() req: any,
  ) {
    return this.papersService.transitionState(
      paperId,
      body.targetStatus,
      req.user.userId,
    );
  }

  @Get(':paperId/pdf')
  async downloadPaperPdf(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('paperId', ParseIntPipe) paperId: number,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return this.papersService.getPaperPdfStream(
      paperId,
      req.user.userId,
      conferenceId,
    );
  }

  @Post(':paperId/rebuttal')
  async submitRebuttal(
    @Param('paperId', ParseIntPipe) paperId: number,
    @Body() dto: SubmitRebuttalDto,
    @Req() req: any,
  ) {
    return this.papersService.submitRebuttal(paperId, req.user.userId, dto);
  }

  @Post(':paperId/decision')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.CHAIR)
  async finalizeDecision(
    @Param('paperId', ParseIntPipe) paperId: number,
    @Body() dto: FinalizeDecisionDto,
    @Req() req: any,
  ) {
    return this.papersService.finalizeDecision(paperId, dto, req.user.userId);
  }
}

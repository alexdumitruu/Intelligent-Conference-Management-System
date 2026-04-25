import {
  Controller,
  Post,
  Patch,
  Delete,
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

  @Get('mine')
  async getMyPapers(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Req() req: any,
  ) {
    return this.papersService.findByAuthor(conferenceId, req.user.userId);
  }

  @Post()
  async createDraft(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() body: { title: string; abstract: string; keywords?: string[]; topics?: string[]; coAuthorIds?: number[] },
    @Req() req: any,
  ) {
    return this.papersService.createPaper(
      body.title,
      body.abstract,
      conferenceId,
      req.user.userId,
      body.keywords,
      body.topics,
      body.coAuthorIds
    );
  }

  @Delete(':paperId')
  async deleteDraft(
    @Param('paperId', ParseIntPipe) paperId: number,
    @Req() req: any,
  ) {
    await this.papersService.deleteDraft(paperId, req.user.userId);
    return { message: 'Draft paper deleted successfully' };
  }

  @Post(':paperId/co-authors')
  async addCoAuthor(
    @Param('paperId', ParseIntPipe) paperId: number,
    @Body() body: { userId: number },
    @Req() req: any,
  ) {
    return this.papersService.addCoAuthor(paperId, req.user.userId, body.userId);
  }

  @Delete(':paperId/co-authors/:coAuthorUserId')
  async removeCoAuthor(
    @Param('paperId', ParseIntPipe) paperId: number,
    @Param('coAuthorUserId', ParseIntPipe) coAuthorUserId: number,
    @Req() req: any,
  ) {
    await this.papersService.removeCoAuthor(paperId, req.user.userId, coAuthorUserId);
    return { message: 'Co-author removed successfully' };
  }

  @Post(':paperId/submit')
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

  @Get('master-table')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.CHAIR)
  async getChairMasterTable(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
  ) {
    return this.papersService.getChairMasterTable(conferenceId);
  }

  @Get(':paperId/details')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.REVIEWER)
  async getReviewerPaperDetails(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('paperId', ParseIntPipe) paperId: number,
    @Req() req: any,
  ) {
    return this.papersService.getReviewerPaperDetails(conferenceId, paperId);
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

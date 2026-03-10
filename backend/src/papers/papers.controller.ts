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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { PapersService } from './papers.service';
import { PaperStatus } from './entities/paper-history.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { ConferenceRoleGuard } from '../common/guards/conference-role.guard';
import { ConferenceRoleType } from '../conferences/entities/conference-role.entity';

@Controller('conferences/:conferenceId/papers')
@UseGuards(AuthGuard('jwt'))
export class PapersController {
  constructor(private readonly papersService: PapersService) {}

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
}

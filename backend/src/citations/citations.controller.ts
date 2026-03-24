import {
  Controller,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { CitationsService } from './citations.service';
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

  @Post('verify-regex')
  @Roles(ConferenceRoleType.CHAIR)
  async verifyCitationsRegex(@Param('paperId', ParseIntPipe) paperId: number) {
    return this.citationsService.generateCitationReport(paperId);
  }

  @Post('verify-ai')
  @Roles(ConferenceRoleType.CHAIR)
  @UseInterceptors(FileInterceptor('file'))
  async verifyCitationsAi(
    @Param('paperId', ParseIntPipe) paperId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.aiCitationsService.generateAiCitationReport(
      paperId,
      file.buffer,
      file.originalname,
    );
  }
}

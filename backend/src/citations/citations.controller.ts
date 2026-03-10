import {
  Controller,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CitationsService } from './citations.service';
import { Roles } from '../common/decorators/roles.decorator';
import { ConferenceRoleGuard } from '../common/guards/conference-role.guard';
import { ConferenceRoleType } from '../conferences/entities/conference-role.entity';

@Controller('conferences/:conferenceId/papers/:paperId/citations')
@UseGuards(AuthGuard('jwt'), ConferenceRoleGuard)
export class CitationsController {
  constructor(private readonly citationsService: CitationsService) {}

  @Post('verify')
  @Roles(ConferenceRoleType.CHAIR)
  async verifyPaperCitations(@Param('paperId', ParseIntPipe) paperId: number) {
    return this.citationsService.generateCitationReport(paperId);
  }
}

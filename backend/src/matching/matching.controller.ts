import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConferenceRoleGuard } from '../common/guards/conference-role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ConferenceRoleType } from '../conferences/entities/conference-role.entity';
import { MatchingService } from './matching.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { CreateConflictDto } from './dto/create-conflict.dto';

@Controller('conferences/:conferenceId/matching')
@UseGuards(AuthGuard('jwt'))
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('papers')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.REVIEWER)
  async getPapersForBidding(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Req() req: any,
  ) {
    return this.matchingService.getPapersForBidding(
      conferenceId,
      req.user.userId,
    );
  }

  @Post('bids')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.REVIEWER)
  async submitBid(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() dto: CreateBidDto,
    @Req() req: any,
  ) {
    return this.matchingService.submitBid(conferenceId, req.user.userId, dto);
  }

  @Post('conflicts')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.REVIEWER)
  async declareConflict(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() dto: CreateConflictDto,
    @Req() req: any,
  ) {
    return this.matchingService.declareConflict(
      conferenceId,
      req.user.userId,
      dto,
    );
  }
}

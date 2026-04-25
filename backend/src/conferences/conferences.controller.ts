import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConferenceRoleGuard } from '../common/guards/conference-role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ConferenceRoleType } from './entities/conference-role.entity';
import { CreateBidDto } from '../matching/dto/create-bid.dto';
import {
  MatchingService,
  MAX_REVIEWS_PER_PAPER,
} from '../matching/matching.service';
import { Paper } from '../papers/entities/paper.entity';
import { PaperStatus } from '../papers/entities/paper-history.entity';
import { Bid } from '../matching/entities/bid.entity';
import { Conflict } from '../matching/entities/conflict.entity';
import { Conference } from './entities/conference.entity';
import { Review } from '../reviews/entities/review.entity';
import { PapersService } from '../papers/papers.service';
import { CreateConflictDto } from '../matching/dto/create-conflict.dto';
import { ConferenceRole } from './entities/conference-role.entity';
import { ConferencesService } from './conferences.service';

@Controller('conferences')
@UseGuards(AuthGuard('jwt'))
export class ConferencesController {
  constructor(
    private readonly matchingService: MatchingService,
    private readonly papersService: PapersService,
    private readonly conferencesService: ConferencesService,
  ) {}

  @Get()
  async getAllConferences() {
    return this.conferencesService.getAllConferences();
  }

  @Get('my-chair-status')
  async getChairStatus(@Req() req: any) {
    const count = await ConferenceRole.count({
      where: { userId: req.user.userId, roleType: ConferenceRoleType.CHAIR },
    });
    return { isChair: count > 0 };
  }

  @Post()
  async createConference(@Body() data: any, @Req() req: any) {
    return this.conferencesService.createConference(data, req.user.userId);
  }

  @Post(':conferenceId/roles')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.CHAIR)
  async assignRole(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() body: { email: string; roleType: string },
  ) {
    return this.conferencesService.assignRoleByEmail(
      conferenceId,
      body.email,
      body.roleType,
    );
  }

  @Get(':id/my-role')
  async getMyRoleForConference(
    @Param('id', ParseIntPipe) conferenceId: number,
    @Req() req: any,
  ) {
    return this.conferencesService.getMyRoleForConference(
      conferenceId,
      req.user.userId,
    );
  }

  @Get(':conferenceId/assigned-papers')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.REVIEWER)
  async getAssignedPapers(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Req() req: any,
  ) {
    const reviews = await Review.findAll({
      where: { userId: req.user.userId },
      include: [
        {
          model: Paper,
          where: { conferenceId: conferenceId },
          attributes: ['id', 'title', 'abstract'],
        },
      ],
    });

    return reviews.map((r) => r.paper);
  }

  @Post(':conferenceId/auto-assign')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.CHAIR)
  async autoAssignReviewers(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Req() req: any,
  ) {
    const conference = await Conference.findByPk(conferenceId, {
      include: [{ model: Paper }],
    });
    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

    const biddingPapers = conference.papers.filter(
      (p) => p.status === PaperStatus.BIDDING,
    );
    if (biddingPapers.length === 0) {
      throw new BadRequestException(
        'No papers in BIDDING status. Transition papers to BIDDING before running the matcher.',
      );
    }

    const reviewerCount = await ConferenceRole.count({
      where: { conferenceId, roleType: ConferenceRoleType.REVIEWER },
    });
    if (reviewerCount === 0) {
      throw new BadRequestException(
        'No reviewers assigned to this conference. Assign reviewer roles first.',
      );
    }

    const createdReviews = await this.matchingService.executeGreedyAssignment(
      conferenceId,
      MAX_REVIEWS_PER_PAPER,
    );

    for (const paper of biddingPapers) {
      await this.papersService.transitionState(
        paper.id,
        PaperStatus.UNDER_REVIEW,
        req.user.userId,
      );
    }

    return {
      message: `Greedy matcher complete.`,
      reviewsCreated: createdReviews.length,
      papersTransitioned: biddingPapers.length,
    };
  }

  @Get(':conferenceId/conflicts')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.CHAIR)
  async getConflicts(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
  ) {
    const papers = await Paper.findAll({
      where: { conferenceId },
      attributes: ['id'],
    });
    const paperIds = papers.map((p) => p.id);

    return Conflict.findAll({
      where: { paperId: paperIds },
    });
  }
}

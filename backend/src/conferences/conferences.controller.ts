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

  @Post()
  async createConference(@Body() data: any) {
    return this.conferencesService.createConference(data);
  }

  @Post(':conferenceId/roles')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.CHAIR)
  async assignRole(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() body: { email: string; roleType: string },
  ) {
    return this.conferencesService.assignRoleByEmail(conferenceId, body.email, body.roleType);
  }

  @Get(':id/my-role')
  async getMyRoleForConference(
    @Param('id', ParseIntPipe) conferenceId: number,
    @Req() req: any,
  ) {
    return this.conferencesService.getMyRoleForConference(conferenceId, req.user.userId);
  }

  @Get(':conferenceId/bidding-papers')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.REVIEWER)
  async getBiddingPapers(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Req() req: any,
  ) {
    const papers = await Paper.findAll({
      where: {
        conferenceId: conferenceId,
        status: PaperStatus.BIDDING,
      },
      attributes: ['id', 'title', 'abstract'],
    });
    if (papers.length === 0) {
      throw new NotFoundException('No papers found for this conference');
    }
    return papers;
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

  @Post(':conferenceId/bids')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.REVIEWER)
  async submitBid(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() createBidDto: CreateBidDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const newBid = new Bid({
      paperId: createBidDto.paperId,
      userId: userId,
      bidType: createBidDto.bidType,
    });
    const existingBid = await Bid.findOne({
      where: { paperId: createBidDto.paperId, userId },
    });
    if (existingBid) {
      await existingBid.destroy();
    }
    await newBid.save();
    return newBid;
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
    await this.matchingService.executeGreedyAssignment(
      conferenceId,
      MAX_REVIEWS_PER_PAPER,
    );
    for (const paper of conference.papers) {
      if (paper.status === PaperStatus.BIDDING) {
        await this.papersService.transitionState(
          paper.id,
          PaperStatus.UNDER_REVIEW,
          req.user.userId,
        );
      }
    }
  }

  @Post(':conferenceId/conflicts')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.REVIEWER)
  async declareConflict(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() dto: CreateConflictDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;

    const paper = await Paper.findByPk(dto.paperId);
    if (!paper || paper.conferenceId !== conferenceId) {
      throw new NotFoundException('Paper not found in this conference');
    }

    const existing = await Conflict.findOne({
      where: { paperId: dto.paperId, userId },
    });
    if (existing) {
      throw new BadRequestException(
        'You have already declared a conflict for this paper',
      );
    }

    const conflict = await Conflict.create({
      paperId: dto.paperId,
      userId,
      reason: dto.reason,
    });
    return conflict;
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

  @Delete(':conferenceId/conflicts/:paperId')
  @UseGuards(ConferenceRoleGuard)
  @Roles(ConferenceRoleType.REVIEWER)
  async retractConflict(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('paperId', ParseIntPipe) paperId: number,
    @Req() req: any,
  ) {
    const conflict = await Conflict.findOne({
      where: { paperId, userId: req.user.userId },
    });
    if (!conflict) {
      throw new NotFoundException('Conflict declaration not found');
    }
    await conflict.destroy();
    return { message: 'Conflict declaration retracted' };
  }
}

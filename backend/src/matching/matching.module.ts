import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Bid } from './entities/bid.entity';
import { Conflict } from './entities/conflict.entity';
import { Paper } from '../papers/entities/paper.entity';
import { PaperAuthor } from '../papers/entities/paper-author.entity';
import { Review } from '../reviews/entities/review.entity';
import { ConferenceRole } from '../conferences/entities/conference-role.entity';
import { Conference } from '../conferences/entities/conference.entity';
import { User } from '../users/entities/user.entity';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Bid,
      Conflict,
      Paper,
      PaperAuthor,
      Review,
      ConferenceRole,
      Conference,
      User,
    ]),
  ],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}

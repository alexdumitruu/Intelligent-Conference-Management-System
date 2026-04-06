import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Review } from './entities/review.entity';
import { ReviewComment } from './entities/review-comment.entity';
import { Paper } from '../papers/entities/paper.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
@Module({
  imports: [SequelizeModule.forFeature([Review, ReviewComment, Paper])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [SequelizeModule],
})
export class ReviewsModule {}

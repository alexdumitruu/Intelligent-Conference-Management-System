import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Review } from './entities/review.entity'
import { ReviewComment } from './entities/review-comment.entity'

@Module({
    imports: [SequelizeModule.forFeature([Review, ReviewComment])],
})
export class ReviewsModule {}

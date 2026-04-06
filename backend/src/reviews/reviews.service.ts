import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Review } from './entities/review.entity';
import { Paper } from '../papers/entities/paper.entity';
import { PaperStatus } from '../papers/entities/paper-history.entity';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { Bid, BidType } from '../matching/entities/bid.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review)
    private readonly reviewModel: typeof Review,
    @InjectModel(Paper)
    private readonly paperModel: typeof Paper,
  ) {}

  async submitPaperReview(
    paperId: number,
    userId: number,
    dto: SubmitReviewDto,
  ): Promise<Review> {
    const paper = await this.paperModel.findByPk(paperId);
    if (!paper) {
      throw new NotFoundException(`Paper with ID ${paperId} not found`);
    }

    if (paper.status !== PaperStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Paper must be in UNDER_REVIEW status to accept reviews',
      );
    }

    const existingAssignment = await this.reviewModel.findOne({
      where: { paperId, userId },
    });
    if (!existingAssignment) {
      const positiveBid = await Bid.findOne({
        where: { paperId, userId, bidType: BidType.POSITIVE },
      });
      if (!positiveBid) {
        throw new ForbiddenException(
          'You are not assigned to review this paper',
        );
      }
    }

    const alreadySubmitted = await this.reviewModel.findOne({
      where: { paperId, userId },
    });
    if (alreadySubmitted && alreadySubmitted.score > 0) {
      throw new BadRequestException(
        'You have already submitted a review for this paper',
      );
    }

    if (alreadySubmitted) {
      alreadySubmitted.score = dto.score;
      alreadySubmitted.confidence = dto.confidence;
      alreadySubmitted.contentAuthors = dto.contentAuthor;
      alreadySubmitted.contentChair = dto.contentChair;
      await alreadySubmitted.save();
      return alreadySubmitted;
    }

    return this.reviewModel.create({
      paperId,
      userId,
      score: dto.score,
      confidence: dto.confidence,
      contentAuthors: dto.contentAuthor,
      contentChair: dto.contentChair,
    });
  }
}

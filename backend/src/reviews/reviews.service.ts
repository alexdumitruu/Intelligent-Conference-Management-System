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
      throw new ForbiddenException('You are not assigned to review this paper');
    }

    if (existingAssignment.score > 0) {
      throw new BadRequestException(
        'You have already submitted a review for this paper',
      );
    }

    existingAssignment.score = dto.score;
    existingAssignment.confidence = dto.confidence;
    existingAssignment.contentAuthors = dto.contentAuthor;
    existingAssignment.contentChair = dto.contentChair;
    await existingAssignment.save();
    return existingAssignment;
  }
}

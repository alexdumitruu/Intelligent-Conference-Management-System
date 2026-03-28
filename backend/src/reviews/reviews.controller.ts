import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewsService } from './reviews.service';
import { SubmitReviewDto } from './dto/submit-review.dto';

@Controller('reviews')
@UseGuards(AuthGuard('jwt'))
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':paperId')
  async submitReview(
    @Param('paperId', ParseIntPipe) paperId: number,
    @Body() submitReviewDto: SubmitReviewDto,
    @Req() req: any,
  ) {
    return this.reviewsService.submitPaperReview(
      paperId,
      req.user.userId,
      submitReviewDto,
    );
  }
}

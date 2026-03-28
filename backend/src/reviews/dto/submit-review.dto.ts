import { IsNumber, IsString, Min, Max } from 'class-validator';
export class SubmitReviewDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  score: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  confidence: number;

  @IsString()
  contentAuthor: string;

  @IsString()
  contentChair: string;
}

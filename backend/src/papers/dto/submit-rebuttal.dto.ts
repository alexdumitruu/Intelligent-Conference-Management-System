import { IsString, MinLength } from 'class-validator';

export class SubmitRebuttalDto {
  @IsString()
  @MinLength(10)
  rebuttalText: string;
}

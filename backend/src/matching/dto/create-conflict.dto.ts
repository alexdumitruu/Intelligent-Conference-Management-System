import { IsNumber, IsString } from 'class-validator';

export class CreateConflictDto {
  @IsNumber()
  paperId: number;

  @IsString()
  reason: string;
}

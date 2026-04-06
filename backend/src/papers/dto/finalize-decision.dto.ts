import { IsEnum } from 'class-validator';
import { PaperStatus } from '../entities/paper-history.entity';

export class FinalizeDecisionDto {
  @IsEnum(PaperStatus)
  decision: PaperStatus;
}

import { IsNumber, IsEnum } from 'class-validator';
import { BidType } from '../entities/bid.entity';

export class CreateBidDto {
  @IsNumber()
  paperId: number;

  @IsEnum(BidType)
  bidType: BidType;
}

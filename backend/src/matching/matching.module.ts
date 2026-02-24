import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Bid } from './entities/bid.entity';
import { Conflict } from './entities/conflict.entity';

@Module({
    imports: [SequelizeModule.forFeature([Bid, Conflict])],
})
export class MatchingModule { }

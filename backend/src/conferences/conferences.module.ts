import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Conference } from './entities/conference.entity';
import { ConferenceRole } from './entities/conference-role.entity';
import { ConferencesController } from './conferences.controller';
import { MatchingModule } from '../matching/matching.module';
import { PapersModule } from '../papers/papers.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Conference, ConferenceRole]),
    MatchingModule,
    forwardRef(() => PapersModule),
  ],
  controllers: [ConferencesController],
  exports: [SequelizeModule],
})
export class ConferencesModule {}

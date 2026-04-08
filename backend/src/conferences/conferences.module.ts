import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Conference } from './entities/conference.entity';
import { ConferenceRole } from './entities/conference-role.entity';
import { ConferencesController } from './conferences.controller';
import { ConferencesService } from './conferences.service';
import { MatchingModule } from '../matching/matching.module';
import { PapersModule } from '../papers/papers.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Conference, ConferenceRole]),
    MatchingModule,
    forwardRef(() => PapersModule),
  ],
  controllers: [ConferencesController],
  providers: [ConferencesService],
  exports: [SequelizeModule, ConferencesService],
})
export class ConferencesModule {}

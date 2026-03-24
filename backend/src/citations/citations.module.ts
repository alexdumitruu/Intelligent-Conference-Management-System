import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';
import { CitationReport } from './entities/citation-report.entity';
import { CitationsService } from './citations.service';
import { AiCitationsService } from './ai-citations.service';
import { CitationsController } from './citations.controller';
import { PapersModule } from '../papers/papers.module';
import { ConferencesModule } from '../conferences/conferences.module';

@Module({
  imports: [
    SequelizeModule.forFeature([CitationReport]),
    HttpModule,
    PapersModule,
    ConferencesModule,
  ],
  providers: [CitationsService, AiCitationsService],
  controllers: [CitationsController],
})
export class CitationsModule {}

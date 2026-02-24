import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Paper } from './entities/paper.entity'
import { PaperHistory } from './entities/paper-history.entity'
import { PaperAuthor } from './entities/paper-author.entity'

@Module({
    imports: [SequelizeModule.forFeature([Paper, PaperHistory, PaperAuthor])],
})
export class PapersModule {}


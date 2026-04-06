import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Paper } from './entities/paper.entity';
import { PaperHistory } from './entities/paper-history.entity';
import { PaperAuthor } from './entities/paper-author.entity';
import { MulterModule } from '@nestjs/platform-express';
import { PapersService } from './papers.service';
import { PapersController } from './papers.controller';
import { ConferencesModule } from '../conferences/conferences.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Paper, PaperHistory, PaperAuthor]),
    MulterModule.register({
      dest: './uploads/papers',
    }),
    forwardRef(() => ConferencesModule),
    MailModule,
  ],
  controllers: [PapersController],
  providers: [PapersService],
  exports: [SequelizeModule, PapersService],
})
export class PapersModule {}

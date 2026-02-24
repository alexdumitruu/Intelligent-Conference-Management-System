import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConferencesModule } from './conferences/conferences.module';
import { PapersModule } from './papers/papers.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MatchingModule } from './matching/matching.module';

@Module({
  imports: [AuthModule, UsersModule, ConferencesModule, PapersModule, ReviewsModule, MatchingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

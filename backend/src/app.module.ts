import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SequelizeModule } from "@nestjs/sequelize";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ConferencesModule } from "./conferences/conferences.module";
import { PapersModule } from "./papers/papers.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { MatchingModule } from "./matching/matching.module";
import { CitationsModule } from './citations/citations.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'mariadb',
        host: configService.getOrThrow<string>("DB_HOST"),
        port: configService.getOrThrow<number>("DB_PORT"),
        username: configService.getOrThrow<string>("DB_USERNAME"),
        password: configService.getOrThrow<string>("DB_PASSWORD"),
        database: configService.getOrThrow<string>("DB_NAME"),
        autoLoadModels: true,
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    ConferencesModule,
    PapersModule,
    ReviewsModule,
    MatchingModule,
    CitationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
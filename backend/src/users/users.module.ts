import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './entities/user.entity'

@Module({
    imports: [SequelizeModule.forFeature([User])],
})
export class UsersModule {}

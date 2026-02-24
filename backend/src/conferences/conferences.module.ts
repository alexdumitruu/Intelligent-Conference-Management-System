import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Conference } from './entities/conference.entity'
import { ConferenceRole } from './entities/conference-role.entity'

@Module({
    imports: [SequelizeModule.forFeature([Conference, ConferenceRole])],
})
export class ConferencesModule { }

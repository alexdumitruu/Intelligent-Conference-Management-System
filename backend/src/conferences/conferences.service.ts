import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Conference } from './entities/conference.entity';
import { ConferenceRole } from './entities/conference-role.entity';

@Injectable()
export class ConferencesService {
  constructor(
    @InjectModel(Conference)
    private conferenceModel: typeof Conference,
    @InjectModel(ConferenceRole)
    private conferenceRoleModel: typeof ConferenceRole,
  ) {}

  async getAllConferences() {
    return this.conferenceModel.findAll();
  }

  async getMyRoleForConference(conferenceId: number, userId: number) {
    const role = await this.conferenceRoleModel.findOne({
      where: { conferenceId, userId },
    });
    if (!role) {
      throw new NotFoundException('Role not found for this conference');
    }
    return { role: role.roleType };
  }
}

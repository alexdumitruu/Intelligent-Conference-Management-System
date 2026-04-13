import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Conference } from './entities/conference.entity';
import { ConferenceRole, ConferenceRoleType } from './entities/conference-role.entity';
import { User } from '../users/entities/user.entity';

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

  async createConference(data: any, userId: number) {
    const conference = await this.conferenceModel.create(data);
    await this.conferenceRoleModel.create({
      conferenceId: conference.id,
      userId,
      roleType: ConferenceRoleType.CHAIR,
    });
    return conference;
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

  async assignRoleByEmail(
    conferenceId: number,
    email: string,
    roleType: string,
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('No user found with this email');
    }
    const existing = await this.conferenceRoleModel.findOne({
      where: { conferenceId, userId: user.id, roleType },
    });
    if (existing) {
      throw new ConflictException('User already has this role');
    }
    return this.conferenceRoleModel.create({
      conferenceId,
      userId: user.id,
      roleType,
    });
  }
}

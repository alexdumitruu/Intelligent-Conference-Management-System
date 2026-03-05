import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/sequelize';
import { ConferenceRole } from '../../conferences/entities/conference-role.entity';
import { ConferenceRoleType } from '../../conferences/entities/conference-role.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class ConferenceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(ConferenceRole)
    private readonly conferenceRoleModel: typeof ConferenceRole,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ConferenceRoleType[]>(
      ROLES_KEY, [context.getHandler(), context.getClass()]
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const userId = request.user.userId;
    const conferenceId = request.params.conferenceId;
    const role = await this.conferenceRoleModel.findOne({
      where: {
        userId,
        conferenceId,
        roleType: requiredRoles,
      },
    });
    return !!role;
  }
}

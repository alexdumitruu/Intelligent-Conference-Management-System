import { SetMetadata } from '@nestjs/common';
import { ConferenceRoleType } from '../../conferences/entities/conference-role.entity';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: ConferenceRoleType[]) =>
  SetMetadata(ROLES_KEY, roles);

// @Roles(ConferenceRoleType.CHAIR)
// @Get('settings')
// getSettings() { ... }
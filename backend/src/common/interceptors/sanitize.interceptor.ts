import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InjectModel } from '@nestjs/sequelize';
import { Conference } from '../../conferences/entities/conference.entity';
import { ConferenceRole, ConferenceRoleType } from '../../conferences/entities/conference-role.entity';

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  constructor(
    @InjectModel(Conference)
    private readonly conferenceModel: typeof Conference,
    @InjectModel(ConferenceRole)
    private readonly conferenceRoleModel: typeof ConferenceRole,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    return next.handle().pipe(
      map(async (data) => {
        const req = context.switchToHttp().getRequest();
        const conferenceId = req.params.conferenceId;
        const userId = req.user?.userId;

        if (conferenceId != null && userId != null) {
          const conference = await this.conferenceModel.findByPk(conferenceId);
          if (conference?.isDoubleBlind === true) {
            const role = await this.conferenceRoleModel.findOne({
              where: { conferenceId, userId },
            });

            if (role?.roleType === ConferenceRoleType.REVIEWER) {
              if (Array.isArray(data)) {
                data.forEach((element) => {
                  delete element.authors;
                  if (element.dataValues) delete element.dataValues.authors;
                });
              } else if (typeof data === 'object' && data !== null) {
                delete data.authors;
                if (data.dataValues) delete data.dataValues.authors;
              }
            }
          }
        }
        return data;
      }),
    );
  }
}

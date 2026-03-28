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

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  constructor(
    @InjectModel(Conference)
    private readonly conferenceModel: typeof Conference,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    return next.handle().pipe(
      map(async (data) => {
        const conferenceId = context.switchToHttp().getRequest()
          .params.conferenceId;
        if (conferenceId != null) {
          const conference = await this.conferenceModel.findByPk(conferenceId);
          if (conference?.isDoubleBlind === true) {
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
        return data;
      }),
    );
  }
}

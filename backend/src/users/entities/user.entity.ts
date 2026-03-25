import { Table, Model, HasMany, Column, DataType } from 'sequelize-typescript';
import { ConferenceRole } from '../../conferences/entities/conference-role.entity';
import { PaperAuthor } from '../../papers/entities/paper-author.entity';
import { Review } from '../../reviews/entities/review.entity';
import { ReviewComment } from '../../reviews/entities/review-comment.entity';
import { PaperHistory } from '../../papers/entities/paper-history.entity';
import { Bid } from '../../matching/entities/bid.entity';
import { Conflict } from '../../matching/entities/conflict.entity';

@Table({ tableName: 'users', underscored: true })
export class User extends Model {
  //attributes
  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING, allowNull: false, field: 'password_hash' })
  passwordHash!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  firstName!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  lastName!: string;

  @Column({ type: DataType.STRING })
  affiliation?: string;

  //relationships
  @HasMany(() => ConferenceRole)
  conferenceRoles!: ConferenceRole[];

  @HasMany(() => PaperAuthor)
  paperAuthors!: PaperAuthor[];

  @HasMany(() => Review)
  reviews!: Review[];

  @HasMany(() => ReviewComment)
  reviewComments!: ReviewComment[];

  @HasMany(() => PaperHistory)
  paperHistories!: PaperHistory[];

  @HasMany(() => Bid)
  bids!: Bid[];

  @HasMany(() => Conflict)
  conflicts!: Conflict[];
}

import { Table, Model, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Column, DataType } from "sequelize-typescript";
import { Conference } from "./conference.entity";
import { User } from "../../users/entities/user.entity";

export enum ConferenceRoleType {
  AUTHOR = "AUTHOR",
  REVIEWER = "REVIEWER",
  CHAIR = "CHAIR",
}

@Table({ tableName: "conference_roles", underscored: true })
export class ConferenceRole extends Model {
  // attributes with foreign keys
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId!: number;

  @ForeignKey(() => Conference)
  @Column({ type: DataType.INTEGER, allowNull: false })
  conferenceId!: number;

  // attributes
  @Column({ type: DataType.ENUM(...Object.values(ConferenceRoleType)), allowNull: false })
  roleType!: ConferenceRoleType;

  // relationships
  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => Conference)
  conference!: Conference;
}
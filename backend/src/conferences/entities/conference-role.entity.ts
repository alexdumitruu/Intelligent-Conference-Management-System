import { Table, Model } from "sequelize-typescript";
@Table({ tableName: "conference_roles", underscored: true })
export class ConferenceRole extends Model {}
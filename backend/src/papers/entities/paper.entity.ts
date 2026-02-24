import { Table, Model } from "sequelize-typescript";
@Table({ tableName: "papers", underscored: true })
export class Paper extends Model {}
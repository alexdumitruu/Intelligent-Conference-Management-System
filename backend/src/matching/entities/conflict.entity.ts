import { Table, Model } from "sequelize-typescript";
@Table({ tableName: "conflicts", underscored: true })
export class Conflict extends Model {}
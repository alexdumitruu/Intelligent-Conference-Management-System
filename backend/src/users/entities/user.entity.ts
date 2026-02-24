import { Table, Model } from "sequelize-typescript";
@Table({ tableName: "users", underscored: true })
export class User extends Model {}
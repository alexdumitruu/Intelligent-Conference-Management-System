import { Table, Model } from "sequelize-typescript";
@Table({ tableName: "paper_histories", underscored: true })
export class PaperHistory extends Model {}
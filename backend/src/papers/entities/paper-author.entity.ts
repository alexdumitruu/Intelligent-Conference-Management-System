import { Table, Model } from "sequelize-typescript";
@Table({ tableName: "paper_authors", underscored: true })
export class PaperAuthor extends Model {}
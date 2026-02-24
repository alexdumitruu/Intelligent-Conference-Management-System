import { Table, Model } from "sequelize-typescript";
@Table({ tableName: "review_comments", underscored: true })
export class ReviewComment extends Model {}
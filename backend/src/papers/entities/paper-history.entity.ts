import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Paper } from "./paper.entity";
import { User } from "src/users/entities/user.entity";

export enum PaperStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  BIDDING = 'BIDDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  DISCUSSION = 'DISCUSSION',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Table({ tableName: "paper_histories", underscored: true })
export class PaperHistory extends Model {
    //attributes
    @Column({type: DataType.INTEGER, allowNull: false})
    paperId!: number;

    @Column({type: DataType.INTEGER, allowNull: false})
    userId!: number;

    @Column({type: DataType.ENUM(...Object.values(PaperStatus)), allowNull: false})
    previousState!: PaperStatus;

    @Column({type: DataType.ENUM(...Object.values(PaperStatus)), allowNull: false})
    newState!: PaperStatus;

    @Column({type: DataType.DATE, allowNull: false})
    timestamp!: Date;

    //relationships
    @ForeignKey(() => Paper)
    @BelongsTo(() => Paper)
    paper!: Paper;

    @ForeignKey(() => User)
    @BelongsTo(() => User)
    user!: User;
}
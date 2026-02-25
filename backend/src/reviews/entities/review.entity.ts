import { Table, Model, Column, DataType, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import { Paper } from "../../papers/entities/paper.entity";
import { User } from "../../users/entities/user.entity";
import { ReviewComment } from "./review-comment.entity";

@Table({ tableName: "reviews", underscored: true })
export class Review extends Model {
    //foreign keys
    @ForeignKey(() => Paper)
    @Column({type: DataType.INTEGER, allowNull: false})
    paperId!: number;

    @ForeignKey(() => User)
    @Column({type: DataType.INTEGER, allowNull: false})
    userId!: number;

    //attributes
    @Column({type: DataType.INTEGER, allowNull: false})
    score!: number;

    @Column({type: DataType.INTEGER, allowNull: false})
    confidence!: number;

    @Column({type: DataType.TEXT, allowNull: false})
    contentAuthors!: string;

    @Column({type: DataType.TEXT, allowNull: false})
    contentChair!: string;

    //relationships
    @BelongsTo(() => Paper)
    paper!: Paper;

    @BelongsTo(() => User)
    user!: User;

    @HasMany(() => ReviewComment)
    reviewComments!: ReviewComment[];
}
import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Review } from "./review.entity";
import { User } from "../../users/entities/user.entity";

@Table({ tableName: "review_comments", underscored: true })
export class ReviewComment extends Model {
    //foreign keys
    @ForeignKey(() => Review)
    @Column({type: DataType.INTEGER, allowNull: false})
    reviewId!: number;

    @ForeignKey(() => User)
    @Column({type: DataType.INTEGER, allowNull: false})
    userId!: number;

    //attributes
    @Column({type: DataType.TEXT, allowNull: false})
    content!: string;

    @Column({type: DataType.BOOLEAN, defaultValue: true, allowNull: false})
    isVisibleToAuthors!: boolean;

    //relationships
    @BelongsTo(() => Review)
    review!: Review;

    @BelongsTo(() => User)
    user!: User;
}
import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Review } from "./review.entity";
import { User } from "src/users/entities/user.entity";

@Table({ tableName: "review_comments", underscored: true })
export class ReviewComment extends Model {
    //attributes
    @Column({type: DataType.INTEGER, allowNull: false})
    reviewId!: number;

    @Column({type: DataType.INTEGER, allowNull: false})
    userId!: number;

    @Column({type: DataType.TEXT, allowNull: false})
    content!: string;

    @Column({type: DataType.BOOLEAN, defaultValue: true, allowNull: false})
    isVisibleToAuthors!: boolean;

    //relationships
    @ForeignKey(() => Review)
    @BelongsTo(() => Review)
    review!: Review;

    @ForeignKey(() => User)
    @BelongsTo(() => User)
    user!: User;
}
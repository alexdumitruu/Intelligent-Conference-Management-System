import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "src/users/entities/user.entity";
import { Paper } from "src/papers/entities/paper.entity";

@Table({ tableName: "review_comments", underscored: true })
export class ReviewComment extends Model {
    //attributes
    @Column({type: DataType.INTEGER, allowNull: false})
    paperId!: number;

    @Column({type: DataType.INTEGER, allowNull: false})
    userId!: number;

    @Column({type: DataType.TEXT, allowNull: false})
    content!: string;

    @Column({type: DataType.BOOLEAN, defaultValue: true, allowNull: false})
    isVisibleToAuthors!: boolean;

    //relationships
    @ForeignKey(() => Paper)
    @BelongsTo(() => Paper)
    paper!: Paper;

    @ForeignKey(() => User)
    @BelongsTo(() => User)
    user!: User;
}
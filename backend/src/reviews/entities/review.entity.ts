import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Paper } from "src/papers/entities/paper.entity";
import { User } from "src/users/entities/user.entity";

@Table({ tableName: "reviews", underscored: true })
export class Review extends Model {
    //attributes
    @Column({type: DataType.INTEGER, allowNull: false})
    paperId!: number;

    @Column({type: DataType.INTEGER, allowNull: false})
    userId!: number;

    @Column({type: DataType.INTEGER, allowNull: false})
    score!: number;

    @Column({type: DataType.INTEGER, allowNull: false})
    confidence!: number;

    @Column({type: DataType.TEXT, allowNull: false})
    contentAuthors!: string;

    @Column({type: DataType.TEXT, allowNull: false})
    contentChair!: string;

    //relationships
    @ForeignKey(() => Paper)
    @BelongsTo(() => Paper)
    paper!: Paper;

    @ForeignKey(() => User)
    @BelongsTo(() => User)
    user!: User;
}
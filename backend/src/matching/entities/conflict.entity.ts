import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Paper } from "src/papers/entities/paper.entity";
import { User } from "src/users/entities/user.entity";

@Table({ tableName: "conflicts", underscored: true })
export class Conflict extends Model {
    //attributes
    @Column({type: DataType.INTEGER, allowNull: false})
    paperId!: number;

    @Column({type: DataType.INTEGER, allowNull: false})
    userId!: number;

    @Column({type: DataType.STRING, allowNull: false})
    reason!: string;

    //relationships
    @ForeignKey(() => Paper)
    @BelongsTo(() => Paper)
    paper!: Paper;

    @ForeignKey(() => User)
    @BelongsTo(() => User)
    user!: User;
}
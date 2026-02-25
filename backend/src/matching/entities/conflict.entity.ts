import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Paper } from "../../papers/entities/paper.entity";
import { User } from "../../users/entities/user.entity";

@Table({ tableName: "conflicts", underscored: true })
export class Conflict extends Model {
    //foreign keys
    @ForeignKey(() => Paper)
    @Column({type: DataType.INTEGER, allowNull: false})
    paperId!: number;

    @ForeignKey(() => User)
    @Column({type: DataType.INTEGER, allowNull: false})
    userId!: number;

    //attributes
    @Column({type: DataType.STRING, allowNull: false})
    reason!: string;

    //relationships
    @BelongsTo(() => Paper)
    paper!: Paper;

    @BelongsTo(() => User)
    user!: User;
}
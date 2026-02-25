import { Table, Model, ForeignKey, BelongsTo, Column, DataType } from "sequelize-typescript";
import { Paper } from "./paper.entity";
import { User } from "src/users/entities/user.entity";

@Table({ tableName: "paper_authors", underscored: true })
export class PaperAuthor extends Model {
    //attributes
    @Column({type: DataType.INTEGER, allowNull: false})
    paperId!: number;

    @Column({type: DataType.INTEGER, allowNull: false})
    userId!: number;

    @Column({type: DataType.INTEGER, allowNull: false})
    authorOrder!: number;

    //relationships
    @ForeignKey(() => Paper)
    @BelongsTo(() => Paper)
    paper!: Paper;

    @ForeignKey(() => User)
    @BelongsTo(() => User)
    user!: User;
}
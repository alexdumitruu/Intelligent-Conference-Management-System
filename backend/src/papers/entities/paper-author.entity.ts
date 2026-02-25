import { Table, Model, ForeignKey, BelongsTo, Column, DataType } from "sequelize-typescript";
import { Paper } from "./paper.entity";
import { User } from "../../users/entities/user.entity";

@Table({ tableName: "paper_authors", underscored: true })
export class PaperAuthor extends Model {
    //foreign keys
    @ForeignKey(() => Paper)
    @Column({type: DataType.INTEGER, allowNull: false})
    paperId!: number;

    @ForeignKey(() => User)
    @Column({type: DataType.INTEGER, allowNull: false})
    userId!: number;

    //attributes
    @Column({type: DataType.INTEGER, allowNull: false})
    authorOrder!: number;

    //relationships
    @BelongsTo(() => Paper)
    paper!: Paper;

    @BelongsTo(() => User)
    user!: User;
}
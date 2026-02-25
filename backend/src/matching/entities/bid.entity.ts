import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Paper } from "../../papers/entities/paper.entity";
import { User } from "../../users/entities/user.entity";

export enum BidType {
    POSITIVE = 'POSITIVE',
    NEGATIVE = 'NEGATIVE',
    NO_BID = 'NO_BID'
}

@Table({ tableName: "bids", underscored: true })
export class Bid extends Model {
    //foreign keys
    @ForeignKey(() => Paper)
    @Column({type: DataType.INTEGER, allowNull: false})
    paperId!: number;

    @ForeignKey(() => User)
    @Column({type: DataType.INTEGER, allowNull: false})
    userId!: number;

    //attributes
    @Column({type: DataType.ENUM(...Object.values(BidType)), allowNull: false})
    bidType!: BidType;

    //relationships
    @BelongsTo(() => Paper)
    paper!: Paper;

    @BelongsTo(() => User)
    user!: User;
}
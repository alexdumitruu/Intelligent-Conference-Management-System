import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Paper } from "src/papers/entities/paper.entity";
import { User } from "src/users/entities/user.entity";

export enum BidType {
    POSITIVE = 'POSITIVE',
    NEGATIVE = 'NEGATIVE',
    NO_BID = 'NO_BID'
}

@Table({ tableName: "bids", underscored: true })
export class Bid extends Model {
    //attributes
    @Column({type: DataType.INTEGER, allowNull: false})
    paperId!: number;

    @Column({type: DataType.INTEGER, allowNull: false})
    userId!: number;

    @Column({type: DataType.ENUM(...Object.values(BidType)), allowNull: false})
    bidType!: BidType;

    //relationships
    @ForeignKey(() => Paper)
    @BelongsTo(() => Paper)
    paper!: Paper;

    @ForeignKey(() => User)
    @BelongsTo(() => User)
    user!: User;
}
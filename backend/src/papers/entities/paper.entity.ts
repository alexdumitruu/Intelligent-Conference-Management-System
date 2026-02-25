import { Table, Model, HasMany, Column, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Conference } from "src/conferences/entities/conference.entity";
import { PaperAuthor } from "./paper-author.entity";
import { Review } from "src/reviews/entities/review.entity";
import { PaperHistory } from "./paper-history.entity";
import { Bid } from "src/matching/entities/bid.entity";
import { Conflict } from "src/matching/entities/conflict.entity";

@Table({ tableName: "papers", underscored: true })
export class Paper extends Model {
    //attributes
    @Column({type: DataType.STRING, allowNull: false})
    title!: string;

    @Column({type: DataType.TEXT, allowNull: false})
    abstract!: string;

    @Column({type: DataType.STRING, allowNull: false})
    pdfPath!: string;

    @Column({type: DataType.INTEGER, allowNull: false})
    conferenceId!: number;

    //relationships
    @ForeignKey(() => Conference)
    @BelongsTo(() => Conference)
    conference!: Conference;

    @HasMany(() => PaperAuthor)
    authors!: PaperAuthor[];

    @HasMany(() => Review)
    reviews!: Review[];

    @HasMany(() => PaperHistory)
    paperHistories!: PaperHistory[];

    @HasMany(() => Bid)
    bids!: Bid[];

    @HasMany(() => Conflict)
    conflicts!: Conflict[];
}
import { Table, Model, HasMany, Column, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { PaperAuthor } from "./paper-author.entity";
import { PaperHistory, PaperStatus } from "./paper-history.entity";
import { Conference } from "../../conferences/entities/conference.entity";
import { Review } from "../../reviews/entities/review.entity";
import { Bid } from "../../matching/entities/bid.entity";
import { Conflict } from "../../matching/entities/conflict.entity";

@Table({ tableName: "papers", underscored: true })
export class Paper extends Model {
    //attributes
    @Column({type: DataType.STRING, allowNull: false})
    title!: string;

    @Column({type: DataType.TEXT, allowNull: false})
    abstract!: string;

    @Column({type: DataType.STRING, allowNull: false})
    pdfPath!: string;

    @ForeignKey(() => Conference)
    @Column({type: DataType.INTEGER, allowNull: false})
    conferenceId!: number;

    @Column({type: DataType.ENUM(...Object.values(PaperStatus)), allowNull: false, defaultValue: PaperStatus.DRAFT})
    status!: PaperStatus;

    //relationships
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
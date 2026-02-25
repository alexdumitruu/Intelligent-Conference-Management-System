import { Table, Model, HasMany, Column, DataType } from "sequelize-typescript";
import { ConferenceRole } from "./conference-role.entity";
import { Paper } from "src/papers/entities/paper.entity";

export enum ConferenceStatus {
    PREPARATION = 'PREPARATION', 
    ACTIVE = 'ACTIVE', 
    ARCHIVED = 'ARCHIVED'
}

@Table({ tableName: "conferences", underscored: true })
export class Conference extends Model {
    //attributes
    @Column({type: DataType.STRING, allowNull: false})
    title!: string;

    @Column({type: DataType.STRING, allowNull: false})
    acronym!: string;

    @Column({type: DataType.TEXT, allowNull: true})
    description!: string;

    @Column({type: DataType.STRING, allowNull: false})
    location!: string;

    @Column({type: DataType.BOOLEAN, defaultValue: false, allowNull: false})
    isDoubleBlind!: boolean;

    @Column({type: DataType.DATE, allowNull: false})
    submissionDeadline!: Date;

    @Column({type: DataType.DATE, allowNull: false})
    reviewDeadline!: Date;

    @Column({type: DataType.DATE, allowNull: false})
    biddingDeadline!: Date;

    @Column({type: DataType.DATE, allowNull: false})
    discussionDeadline!: Date;

    @Column({type: DataType.DATE, allowNull: false})
    conferenceStartDate!: Date;

    @Column({type: DataType.DATE, allowNull: false})
    conferenceEndDate!: Date;

    @Column({type: DataType.ENUM(...Object.values(ConferenceStatus)), allowNull: false})
    status!: ConferenceStatus;

    // relationships
    @HasMany(() => ConferenceRole)
    conferenceRoles!: ConferenceRole[];

    @HasMany(() => Paper)
    papers!: Paper[];
}
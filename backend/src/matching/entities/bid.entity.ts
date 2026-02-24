import { Table, Model } from "sequelize-typescript";
@Table({ tableName: "bids", underscored: true })
export class Bid extends Model {}
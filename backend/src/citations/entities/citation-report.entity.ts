import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Paper } from '../../papers/entities/paper.entity';
import { ExtractionMethod } from '../extraction-method.enum';

@Table({ tableName: 'citation_reports', underscored: true })
export class CitationReport extends Model {
  @ForeignKey(() => Paper)
  @Column({ type: DataType.INTEGER, allowNull: false })
  paperId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  totalCitations!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  verifiedCitations!: number;

  @Column({ type: DataType.JSON, allowNull: false })
  flaggedErrors!: object[];

  @Column({
    type: DataType.ENUM(...Object.values(ExtractionMethod)),
    allowNull: false,
  })
  extractionMethod!: ExtractionMethod;

  @BelongsTo(() => Paper)
  paper!: Paper;
}

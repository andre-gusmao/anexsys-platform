import { Column, Entity } from 'typeorm';
import {
  QualityInspectionResult,
  QualityInspectionType,
  QualityReleaseDecision,
} from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'quality_records' })
export class QualityRecordEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'production_order_id', type: 'uuid' })
  productionOrderId!: string;

  @Column({ name: 'service_order_item_id', type: 'uuid', nullable: true })
  serviceOrderItemId!: string | null;

  @Column({ name: 'workflow_definition_id', type: 'uuid', nullable: true })
  workflowDefinitionId!: string | null;

  @Column({ name: 'current_status_definition_id', type: 'uuid', nullable: true })
  currentStatusDefinitionId!: string | null;

  @Column({ name: 'quality_responsible_actor_id', type: 'uuid', nullable: true })
  qualityResponsibleActorId!: string | null;

  @Column({ name: 'inspection_type', type: 'varchar', length: 50 })
  inspectionType!: QualityInspectionType;

  @Column({ name: 'inspection_result', type: 'varchar', length: 30 })
  inspectionResult!: QualityInspectionResult;

  @Column({ name: 'inspection_at', type: 'timestamptz' })
  inspectionAt!: Date;

  @Column({ name: 'release_decision', type: 'varchar', length: 40 })
  releaseDecision!: QualityReleaseDecision;

  @Column({ name: 'defects', type: 'jsonb', nullable: true })
  defects!: Array<Record<string, unknown>> | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;
}

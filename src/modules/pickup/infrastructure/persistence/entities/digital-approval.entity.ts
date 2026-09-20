import { Column, Entity } from 'typeorm';
import { DigitalApprovalDecision, DigitalApprovalType, InteractionChannel } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'digital_approvals' })
export class DigitalApprovalEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId!: string | null;

  @Column({ name: 'service_order_id', type: 'uuid', nullable: true })
  serviceOrderId!: string | null;

  @Column({ name: 'production_order_id', type: 'uuid', nullable: true })
  productionOrderId!: string | null;

  @Column({ name: 'production_order_version_id', type: 'uuid', nullable: true })
  productionOrderVersionId!: string | null;

  @Column({ name: 'pickup_authorization_id', type: 'uuid', nullable: true })
  pickupAuthorizationId!: string | null;

  @Column({ name: 'approval_type', type: 'varchar', length: 40 })
  approvalType!: DigitalApprovalType;

  @Column({ name: 'request_channel', type: 'varchar', length: 30, nullable: true })
  requestChannel!: InteractionChannel | null;

  @Column({ name: 'approval_link_token', type: 'varchar', length: 120, nullable: true })
  approvalLinkToken!: string | null;

  @Column({ name: 'requested_at', type: 'timestamptz', nullable: true })
  requestedAt!: Date | null;

  @Column({ name: 'decision', type: 'varchar', length: 20 })
  decision!: DigitalApprovalDecision;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt!: Date | null;

  @Column({ name: 'decided_by', type: 'uuid', nullable: true })
  decidedBy!: string | null;

  @Column({ name: 'decision_notes', type: 'text', nullable: true })
  decisionNotes!: string | null;

  @Column({ name: 'evidence_payload', type: 'jsonb', nullable: true })
  evidencePayload!: Record<string, unknown> | null;
}

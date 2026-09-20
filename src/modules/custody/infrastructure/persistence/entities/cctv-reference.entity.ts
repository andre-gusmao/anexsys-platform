import { Column, Entity } from 'typeorm';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'cctv_references' })
export class CctvReferenceEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'custody_event_id', type: 'uuid' })
  custodyEventId!: string;

  @Column({ name: 'source_label', type: 'text' })
  sourceLabel!: string;

  @Column({ name: 'captured_at', type: 'timestamptz' })
  capturedAt!: Date;

  @Column({ name: 'reference_uri', type: 'text' })
  referenceUri!: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;
}

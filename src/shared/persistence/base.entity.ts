import { Column, CreateDateColumn, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export abstract class MutableBusinessEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'updated_by', type: 'uuid' })
  updatedBy!: string;

  @Column({ name: 'row_version', type: 'bigint', default: () => '1' })
  rowVersion!: string;
}

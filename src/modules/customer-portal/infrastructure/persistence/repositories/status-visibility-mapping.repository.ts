import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusVisibilityMappingEntity } from '../entities/status-visibility-mapping.entity';

@Injectable()
export class StatusVisibilityMappingRepository {
  constructor(@InjectRepository(StatusVisibilityMappingEntity) private readonly repository: Repository<StatusVisibilityMappingEntity>) {}

  create(payload: Partial<StatusVisibilityMappingEntity>): StatusVisibilityMappingEntity { return this.repository.create(payload); }
  async save(entity: StatusVisibilityMappingEntity): Promise<StatusVisibilityMappingEntity> { return this.repository.save(entity); }
  async findByTenant(tenantId: string): Promise<StatusVisibilityMappingEntity[]> { return this.repository.find({ where: { tenantId }, order: { internalName: 'ASC' } }); }
  async findByTenantAndInternalName(tenantId: string, internalName: string): Promise<StatusVisibilityMappingEntity | null> { return this.repository.findOne({ where: { tenantId, internalName } }); }
}

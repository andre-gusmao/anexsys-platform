import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrderProofNoteEntity } from '../entities/service-order-proof-note.entity';

@Injectable()
export class ServiceOrderProofNoteRepository {
  constructor(
    @InjectRepository(ServiceOrderProofNoteEntity)
    private readonly repository: Repository<ServiceOrderProofNoteEntity>,
  ) {}

  create(payload: Partial<ServiceOrderProofNoteEntity>): ServiceOrderProofNoteEntity {
    return this.repository.create(payload);
  }

  async save(note: ServiceOrderProofNoteEntity): Promise<ServiceOrderProofNoteEntity> {
    return this.repository.save(note);
  }

  async findByServiceOrder(serviceOrderId: string): Promise<ServiceOrderProofNoteEntity[]> {
    return this.repository.find({
      where: { serviceOrderId, isDeleted: false },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }
}

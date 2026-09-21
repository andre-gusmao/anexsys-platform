import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserContextPreferenceEntity } from '../entities/user-context-preference.entity';

@Injectable()
export class UserContextPreferenceRepository {
  constructor(
    @InjectRepository(UserContextPreferenceEntity)
    private readonly repository: Repository<UserContextPreferenceEntity>,
  ) {}

  create(payload: Partial<UserContextPreferenceEntity>): UserContextPreferenceEntity {
    return this.repository.create(payload);
  }

  async save(preference: UserContextPreferenceEntity): Promise<UserContextPreferenceEntity> {
    return this.repository.save(preference);
  }

  async findByEmail(normalizedEmail: string): Promise<UserContextPreferenceEntity | null> {
    return this.repository.findOne({ where: { normalizedEmail } });
  }
}

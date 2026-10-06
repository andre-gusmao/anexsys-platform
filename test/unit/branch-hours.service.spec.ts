import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BranchHoursSeedService } from 'src/modules/company/application/company/branch-hours-seed.service';
import { BranchHoursService } from 'src/modules/company/application/company/branch-hours.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

function hoursStack() {
  const saved: Array<Record<string, unknown>> = [];
  const repo = {
    async deleteByBranch() {},
    create(payload: Record<string, unknown>) {
      return payload;
    },
    async saveMany(rows: Array<Record<string, unknown>>) {
      saved.push(...rows);
      return rows;
    },
    async findByBranch() {
      return saved;
    },
  };
  const seed = new BranchHoursSeedService(repo as never);
  const service = new BranchHoursService(
    seed,
    {
      async getById() {
        return { id: 'branch-1', tenantId: 'tenant-1', timezone: 'America/Sao_Paulo', updatedBy: 'actor-1' };
      },
      async update() {
        return {};
      },
    } as never,
  );
  return { service, saved };
}

describe('BranchHoursService', () => {
  it('stores cutoff equal to closing time by default', async () => {
    const { service, saved } = hoursStack();
    await service.seedDefaults('tenant-1', 'branch-1', 'actor-1');
    const saturday = saved.find((row) => row.weekday === 6);
    const sunday = saved.find((row) => row.weekday === 0);
    const monday = saved.find((row) => row.weekday === 1);
    assert.equal(saturday?.closesAt, '14:00');
    assert.equal(saturday?.cutoffAt, '14:00');
    assert.equal(monday?.closesAt, '18:00');
    assert.equal(monday?.cutoffAt, '18:00');
    assert.equal(sunday?.isOpen, false);
  });

  it('rejects incomplete weekly hours', async () => {
    const { service } = hoursStack();
    await assert.rejects(
      () =>
        service.replaceHours(
          'tenant-1',
          'branch-1',
          [{ weekday: 1, isOpen: true, opensAt: '09:30', closesAt: '18:00', cutoffAt: '18:00' }],
          'actor-1',
        ),
      DomainValidationError,
    );
  });
});

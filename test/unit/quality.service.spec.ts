import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { QualityService } from 'src/modules/quality/application/quality/quality.service';
import { QualityInspectionResult, QualityReleaseDecision } from 'src/shared/domain/enums';

describe('QualityService', () => {
  it('requests rework from a quality record and links the created case', async () => {
    const audits: Array<Record<string, unknown>> = [];
    const reworkCalls: Array<Record<string, unknown>> = [];
    const record = {
      id: 'quality-1',
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      productionOrderId: 'production-1',
      releaseDecision: QualityReleaseDecision.PENDING,
      inspectionResult: QualityInspectionResult.PENDING,
      updatedBy: null,
      qualityResponsibleActorId: null,
    };

    const service = new QualityService(
      {
        async findById() {
          return record;
        },
        async save(payload: typeof record) {
          return payload;
        },
        create(payload: typeof record) {
          return payload;
        },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { async record(payload: Record<string, unknown>) { audits.push(payload); }, async listByEntity() { return []; } } as never,
      {
        async create(payload: Record<string, unknown>) {
          reworkCalls.push(payload);
          return { id: 'rework-1' };
        },
      } as never,
      {} as never,
    );

    const response = await service.requestRework('quality-1', 'tenant-1', {
      actorUserId: 'user-1',
      affectedServiceOrderItemIds: ['item-1'],
      reworkReason: 'Loose seam found during final inspection',
      correctiveOperationalResourceId: 'resource-2',
      assignmentNotes: 'Route to specialist',
    });

    assert.equal(response.qualityRecord.releaseDecision, QualityReleaseDecision.REWORK_REQUESTED);
    assert.equal(response.qualityRecord.inspectionResult, QualityInspectionResult.FAILED);
    assert.equal(response.reworkCase.id, 'rework-1');
    assert.equal(reworkCalls[0]?.qualityRecordId, 'quality-1');
    assert.equal(audits[0]?.action, 'quality_record.rework.requested');
  });
});

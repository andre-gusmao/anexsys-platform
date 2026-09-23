import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeCompanyListRecords,
  normalizeCompanyRecord,
  resolveActiveCompanyId,
} from '../../frontend/src/components/admin/company-list-records';

describe('company list response normalization', () => {
  it('keeps valid tenant list fields for grid rendering', () => {
    const [record] = normalizeCompanyListRecords([
      {
        id: 'tenant-1',
        code: 'ANXDEV',
        legalName: 'ANEXSYS DEV LTDA',
        displayName: 'ANEXSYS DEV',
        status: 'active',
        warrantyAdjustmentPeriodDays: 5,
        warrantyExecutionPeriodDays: 9,
        blockDeliveryWithOutstandingBalance: true,
      },
    ]);

    assert.deepEqual(record, {
      id: 'tenant-1',
      code: 'ANXDEV',
      legalName: 'ANEXSYS DEV LTDA',
      displayName: 'ANEXSYS DEV',
      status: 'active',
      warrantyAdjustmentPeriodDays: 5,
      warrantyExecutionPeriodDays: 9,
      blockDeliveryWithOutstandingBalance: true,
    });
  });

  it('fills grid-safe defaults when the list response is partial', () => {
    const record = normalizeCompanyRecord(
      {
        code: 'ANXDEV',
        legalName: 'ANEXSYS DEV LTDA',
        displayName: 'ANEXSYS DEV',
      },
      0,
    );

    assert.deepEqual(record, {
      id: 'ANXDEV',
      code: 'ANXDEV',
      legalName: 'ANEXSYS DEV LTDA',
      displayName: 'ANEXSYS DEV',
      status: 'active',
      warrantyAdjustmentPeriodDays: 7,
      warrantyExecutionPeriodDays: 7,
      blockDeliveryWithOutstandingBalance: false,
    });
  });

  it('fills missing identity and naming fields with stable fallbacks', () => {
    const record = normalizeCompanyRecord({}, 1);

    assert.deepEqual(record, {
      id: 'TENANT-2',
      code: 'TENANT-2',
      legalName: 'TENANT-2',
      displayName: 'TENANT-2',
      status: 'active',
      warrantyAdjustmentPeriodDays: 7,
      warrantyExecutionPeriodDays: 7,
      blockDeliveryWithOutstandingBalance: false,
    });
  });

  it('preserves the current active company when the normalized list still contains it', () => {
    const records = normalizeCompanyListRecords([
      { id: 'tenant-1', code: 'ANXDEV', legalName: 'ANEXSYS DEV LTDA', displayName: 'ANEXSYS DEV' },
      { id: 'tenant-2', code: 'ANXHQ', legalName: 'ANEXSYS HQ LTDA', displayName: 'ANEXSYS HQ' },
    ]);

    assert.equal(resolveActiveCompanyId(records, 'tenant-2'), 'tenant-2');
  });
});

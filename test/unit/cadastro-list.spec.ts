import assert from 'node:assert/strict';
import test from 'node:test';
import { applyFilialListFilters, buildFilialExcelCsv } from '../../frontend/src/components/admin/filial-list';
import { applyContaListFilters, buildContaExcelCsv } from '../../frontend/src/components/admin/conta-list';
import { applyOsListFilters, buildOsExcelCsv } from '../../frontend/src/components/service-orders/os-list';

test('filters filiais by name, code and status', () => {
  const filiais = [
    { id: '1', code: 'MTZ', legalName: 'Matriz LTDA', displayName: 'Matriz', status: 'active' as const, businessCalendarName: 'Padrão', isDefault: true },
    { id: '2', code: 'FIL', legalName: 'Filial Norte', displayName: 'Norte', status: 'inactive' as const, businessCalendarName: null },
  ];
  assert.deepEqual(applyFilialListFilters(filiais, { name: 'norte', code: '', status: '' }).map((item) => item.id), ['2']);
  assert.deepEqual(applyFilialListFilters(filiais, { name: '', code: 'mtz', status: '' }).map((item) => item.id), ['1']);
  assert.deepEqual(applyFilialListFilters(filiais, { name: '', code: '', status: 'inactive' }).map((item) => item.id), ['2']);
  assert.match(buildFilialExcelCsv([filiais[0]]), /Matriz/);
});

test('filters contas by name and code', () => {
  const contas = [
    { id: '1', code: 'ANXDEV', legalName: 'ANEXSYS DEV LTDA', displayName: 'ANEXSYS DEV', status: 'active' as const, warrantyAdjustmentPeriodDays: 7, warrantyExecutionPeriodDays: 7 },
    { id: '2', code: 'AGASSUS', legalName: 'Agassus LTDA', displayName: 'agassus', status: 'active' as const, warrantyAdjustmentPeriodDays: 5, warrantyExecutionPeriodDays: 9 },
  ];
  assert.deepEqual(applyContaListFilters(contas, { name: 'agassus', code: '', status: '' }).map((item) => item.id), ['2']);
  assert.deepEqual(applyContaListFilters(contas, { name: '', code: 'ANX', status: '' }).map((item) => item.id), ['1']);
  assert.match(buildContaExcelCsv([contas[1]]), /AGASSUS/);
});

test('filters OS by number and status', () => {
  const orders = [
    { id: '1', orderNo: 'OS-100', promisedDeliveryDate: '2026-10-10', deliveryType: 'Standard', operationalPriority: null, status: 'open', totalValue: '120' },
    { id: '2', orderNo: 'OS-200', promisedDeliveryDate: '2026-10-12', deliveryType: 'Express', operationalPriority: 'alta', status: 'approved', totalValue: null },
  ];
  assert.deepEqual(applyOsListFilters(orders, { name: 'os-200', status: '', deliveryType: '' }).map((item) => item.id), ['2']);
  assert.deepEqual(applyOsListFilters(orders, { name: '', status: 'open', deliveryType: '' }).map((item) => item.id), ['1']);
  assert.deepEqual(applyOsListFilters(orders, { name: '', status: '', deliveryType: 'Express' }).map((item) => item.id), ['2']);
  assert.match(buildOsExcelCsv([orders[0]]), /OS-100/);
});

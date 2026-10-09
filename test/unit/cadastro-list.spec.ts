import assert from 'node:assert/strict';
import test from 'node:test';
import { applyFilialListFilters, buildFilialExcelCsv } from '../../frontend/src/components/admin/filial-list';
import { applyContaListFilters, buildContaExcelCsv } from '../../frontend/src/components/admin/conta-list';
import { applyOsListFilters, buildOsExcelCsv, osDeliveryTypeLabel, osStatusLabel } from '../../frontend/src/components/service-orders/os-list';
import { applyProductPriceFilters, buildProductPriceExcelCsv } from '../../frontend/src/components/catalog/product-price-list';
import { applyMeasurementListFilters, buildMeasurementExcelCsv } from '../../frontend/src/components/measurements/measurement-list';
import {
  applyAccessCommunityListFilters,
  applyAccessPermissionListFilters,
  applyAccessRoleListFilters,
  applyAccessUserListFilters,
  buildAccessCommunityExcelCsv,
  buildAccessPermissionExcelCsv,
  buildAccessRoleExcelCsv,
  buildAccessUserExcelCsv,
} from '../../frontend/src/components/admin/access-list';

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
  const withPayment = [
    { ...orders[0], paymentStatus: 'pending' as const },
    { ...orders[1], paymentStatus: 'paid' as const },
  ];
  assert.deepEqual(applyOsListFilters(withPayment, { name: '', status: '', deliveryType: '', payment: 'open' }).map((item) => item.id), ['1']);
  assert.deepEqual(applyOsListFilters(withPayment, { name: '', status: '', deliveryType: '', payment: 'paid' }).map((item) => item.id), ['2']);
  assert.match(buildOsExcelCsv([orders[0]]), /OS-100/);
  assert.match(buildOsExcelCsv([orders[0]]), /Normal/);
  assert.match(buildOsExcelCsv([orders[0]]), /Aberta/);
  assert.equal(osDeliveryTypeLabel('Priority'), 'Urgente');
  assert.equal(osStatusLabel('cancelled'), 'Cancelada');
  assert.equal(osStatusLabel('in_production'), 'Em produção');
  assert.equal(osStatusLabel('awaiting_proof'), 'Aguardando prova');
  assert.equal(osStatusLabel('awaiting_quality'), 'Aguardando controle de qualidade');
  assert.equal(osStatusLabel('quality'), 'Controle de qualidade');
  assert.equal(osStatusLabel('in_rework'), 'Em refação');
  assert.equal(osStatusLabel('ready_for_pickup'), 'Pronto para retirada');
  assert.equal(osStatusLabel('picked_up'), 'Retirado');
});

test('filters product-service prices by product and service', () => {
  const records = [
    { id: '1', productId: 'p1', serviceId: 's1', productName: 'Calça', serviceName: 'Barra Original', suggestedPrice: '25.00', estimatedMinutes: 15, status: 'active' as const },
    { id: '2', productId: 'p2', serviceId: 's1', productName: 'Vestido', serviceName: 'Barra Original', suggestedPrice: '40.00', estimatedMinutes: 25, status: 'inactive' as const },
  ];
  assert.deepEqual(applyProductPriceFilters(records, { product: 'calça', service: '', status: '' }).map((item) => item.id), ['1']);
  assert.deepEqual(applyProductPriceFilters(records, { product: 'Calça · Barra Original', service: '', status: '' }).map((item) => item.id), ['1']);
  assert.deepEqual(applyProductPriceFilters(records, { q: 'barra original', service: '', status: '' }).map((item) => item.id), ['1', '2']);
  assert.deepEqual(applyProductPriceFilters(records, { product: '', service: 'barra', status: 'inactive' }).map((item) => item.id), ['2']);
  assert.match(buildProductPriceExcelCsv([records[0]]), /Calça/);
  assert.match(buildProductPriceExcelCsv([records[0]]), /15/);
});

test('filters measurement catalog records by name, code and status', () => {
  const records = [
    { id: '1', code: 'BUSTO', displayName: 'Busto', sortOrder: 1, status: 'active' as const },
    { id: '2', code: 'CM', displayName: 'Centímetros', sortOrder: 0, status: 'inactive' as const },
  ];
  assert.deepEqual(applyMeasurementListFilters(records, { name: 'cent', code: '', status: '' }).map((item) => item.id), ['2']);
  assert.deepEqual(applyMeasurementListFilters(records, { name: '', code: 'busto', status: '' }).map((item) => item.id), ['1']);
  assert.deepEqual(applyMeasurementListFilters(records, { name: '', code: '', status: 'inactive' }).map((item) => item.id), ['2']);
  assert.match(buildMeasurementExcelCsv([records[0]]), /Ativo/);
});

test('filters access users by name, email and status', () => {
  const users = [
    { id: '1', email: 'ana@atelier.com', displayName: 'Ana Silva', defaultBranchId: null, status: 'active' as const },
    { id: '2', email: 'bruno@atelier.com', displayName: 'Bruno Costa', defaultBranchId: null, status: 'inactive' as const },
  ];
  assert.deepEqual(applyAccessUserListFilters(users, { name: 'bruno', email: '', status: '' }).map((item) => item.id), ['2']);
  assert.deepEqual(applyAccessUserListFilters(users, { name: '', email: 'ana@', status: '' }).map((item) => item.id), ['1']);
  assert.deepEqual(applyAccessUserListFilters(users, { name: '', email: '', status: 'inactive' }).map((item) => item.id), ['2']);
  assert.match(buildAccessUserExcelCsv([users[0]]), /Ana Silva/);
});

test('filters access roles, permissions and communities', () => {
  const roles = [
    { id: '1', code: 'ADMIN', displayName: 'Administrador', description: null, status: 'active' as const, isSystemManaged: true },
    { id: '2', code: 'ATEND', displayName: 'Atendente', description: null, status: 'inactive' as const, isSystemManaged: false },
  ];
  const permissions = [
    { id: '1', code: 'users.read', displayName: 'Ler usuários', description: null },
    { id: '2', code: 'roles.write', displayName: 'Escrever papéis', description: null },
  ];
  const communities = [
    { id: '1', code: 'COSTURA', displayName: 'Costura', description: null, status: 'active' as const },
    { id: '2', code: 'CORTE', displayName: 'Corte', description: null, status: 'inactive' as const },
  ];
  assert.deepEqual(applyAccessRoleListFilters(roles, { name: 'atend', code: '', status: '' }).map((item) => item.id), ['2']);
  assert.deepEqual(applyAccessRoleListFilters(roles, { name: '', code: '', status: 'inactive' }).map((item) => item.id), ['2']);
  assert.deepEqual(applyAccessPermissionListFilters(permissions, { name: 'papéis', code: '' }).map((item) => item.id), ['2']);
  assert.deepEqual(applyAccessCommunityListFilters(communities, { name: '', code: 'corte', status: '' }).map((item) => item.id), ['2']);
  assert.match(buildAccessRoleExcelCsv([roles[0]]), /Administrador/);
  assert.match(buildAccessPermissionExcelCsv([permissions[0]]), /users.read/);
  assert.match(buildAccessCommunityExcelCsv([communities[0]]), /Costura/);
});

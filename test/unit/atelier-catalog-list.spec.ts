import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyAtelierCatalogFilters,
  atelierCatalogStatusLabel,
  buildAtelierCatalogExcelCsv,
} from '../../frontend/src/components/catalog/atelier-catalog-list';

test('filters catalog records by name and status', () => {
  const records = [
    { id: '1', code: 'CALCA', displayName: 'Calça', defaultPrice: null, sortOrder: 1, status: 'active' as const },
    { id: '2', code: 'SAIA', displayName: 'Saia', defaultPrice: null, sortOrder: 2, status: 'inactive' as const },
  ];

  assert.equal(applyAtelierCatalogFilters(records, { name: 'cal', status: '' }).length, 1);
  assert.equal(applyAtelierCatalogFilters(records, { status: 'inactive' })[0]?.displayName, 'Saia');
  assert.equal(atelierCatalogStatusLabel('inactive'), 'Inativo');
  assert.match(buildAtelierCatalogExcelCsv(records, true), /Preço padrão/);
});

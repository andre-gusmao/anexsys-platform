import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCustomerListFilters,
  buildCustomerEmailCsv,
  buildCustomerExcelCsv,
  buildPaginationItems,
  emptyCustomerListFilters,
  normalizeCustomerListColumnIds,
  paginateCustomerList,
  type CustomerListRecord,
} from '../../frontend/src/components/customers/customer-list';

const customers: CustomerListRecord[] = [
  {
    id: '1',
    customerType: 'person',
    legalName: 'Maria Silva',
    tradeName: null,
    cpfCnpj: '12345678900',
    email: 'maria@atelier.test',
    phone: '11988887777',
    city: 'São Paulo',
    state: 'SP',
    status: 'active',
    createdAt: '2026-04-22T15:14:57.000Z',
  },
  {
    id: '2',
    customerType: 'company',
    legalName: 'Ateliê Norte',
    tradeName: 'Norte',
    cpfCnpj: '11222333000181',
    email: null,
    phone: '1133334444',
    city: 'Campinas',
    state: 'SP',
    status: 'inactive',
    createdAt: '2026-03-17T13:13:21.000Z',
  },
];

test('filters the customer grid by document, city and email', () => {
  const byCity = applyCustomerListFilters(customers, { ...emptyCustomerListFilters(), city: 'campinas' });
  assert.deepEqual(
    byCity.map((customer) => customer.id),
    ['2'],
  );

  const byDocument = applyCustomerListFilters(customers, { ...emptyCustomerListFilters(), document: '123.456' });
  assert.deepEqual(
    byDocument.map((customer) => customer.id),
    ['1'],
  );
});

test('paginates the customer grid and keeps the page inside bounds', () => {
  const firstPage = paginateCustomerList(customers, 1, 10);
  assert.equal(firstPage.totalPages, 1);
  assert.equal(firstPage.items.length, 2);

  const tinyPage = paginateCustomerList(customers, 9, 1);
  assert.equal(tinyPage.currentPage, 2);
  assert.equal(tinyPage.items[0]?.id, '2');
});

test('builds Excel and email exports from selected customers', () => {
  const excel = buildCustomerExcelCsv([customers[0]]);
  assert.match(excel, /Maria Silva/);
  assert.match(excel, /maria@atelier.test/);

  const emails = buildCustomerEmailCsv(customers);
  assert.equal(emails, 'maria@atelier.test');
});

test('keeps the name column when restoring visible columns', () => {
  assert.deepEqual(normalizeCustomerListColumnIds(['phone', 'email']), ['name', 'phone', 'email']);
  assert.deepEqual(normalizeCustomerListColumnIds(['unknown']), ['name']);
});

test('builds numbered pagination with ellipsis', () => {
  assert.deepEqual(buildPaginationItems(2, 16), [1, 2, 3, 4, 5, 'ellipsis', 16]);
  assert.deepEqual(buildPaginationItems(10, 16), [1, 'ellipsis', 9, 10, 11, 'ellipsis', 16]);
  assert.deepEqual(buildPaginationItems(15, 16), [1, 'ellipsis', 12, 13, 14, 15, 16]);
  assert.deepEqual(buildPaginationItems(1, 4), [1, 2, 3, 4]);
});

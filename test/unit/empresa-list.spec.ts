import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyEmpresaListFilters,
  buildEmpresaEmailCsv,
  buildEmpresaExcelCsv,
  emptyEmpresaListFilters,
  empresaDisplayName,
  empresaListStatusLabel,
  formatEmpresaCnpj,
  normalizeEmpresaListColumnIds,
  type EmpresaListRecord,
} from '../../frontend/src/components/admin/empresa-list';

const empresas: EmpresaListRecord[] = [
  {
    id: '1',
    legalName: 'Atelier A LTDA',
    tradeName: 'Atelier A',
    cnpj: '11222333000181',
    email: 'a@atelier.test',
    phone: '1133334444',
    city: 'São Paulo',
    state: 'SP',
    isDefault: true,
    status: 'active',
  },
  {
    id: '2',
    legalName: 'Atelier B LTDA',
    tradeName: 'Atelier B',
    cnpj: '99888777000166',
    email: null,
    phone: '11988887777',
    city: 'Campinas',
    state: 'SP',
    isDefault: false,
    status: 'inactive',
  },
];

test('filters the empresa grid by name, document, city and email', () => {
  const byName = applyEmpresaListFilters(empresas, { ...emptyEmpresaListFilters(), name: 'atelier b' });
  assert.deepEqual(
    byName.map((empresa) => empresa.id),
    ['2'],
  );

  const byCity = applyEmpresaListFilters(empresas, { ...emptyEmpresaListFilters(), city: 'campinas' });
  assert.deepEqual(
    byCity.map((empresa) => empresa.id),
    ['2'],
  );

  const byDocument = applyEmpresaListFilters(empresas, { ...emptyEmpresaListFilters(), document: '11.222.333' });
  assert.deepEqual(
    byDocument.map((empresa) => empresa.id),
    ['1'],
  );

  const byEmail = applyEmpresaListFilters(empresas, { ...emptyEmpresaListFilters(), email: 'a@atelier' });
  assert.deepEqual(
    byEmail.map((empresa) => empresa.id),
    ['1'],
  );
});

test('formats CNPJ and prefers trade name on the grid', () => {
  assert.equal(formatEmpresaCnpj('11222333000181'), '11.222.333/0001-81');
  assert.equal(formatEmpresaCnpj(null), '—');
  assert.equal(empresaDisplayName(empresas[0]), 'Atelier A');
  assert.equal(empresaDisplayName({ legalName: 'Só Razão', tradeName: null }), 'Só Razão');
  assert.equal(empresaListStatusLabel('inactive'), 'Inativa');
});

test('filters the empresa grid by status', () => {
  const inactive = applyEmpresaListFilters(empresas, { ...emptyEmpresaListFilters(), status: 'inactive' });
  assert.deepEqual(
    inactive.map((empresa) => empresa.id),
    ['2'],
  );
});

test('builds Excel and email exports from selected empresas', () => {
  const excel = buildEmpresaExcelCsv([empresas[0]]);
  assert.match(excel, /Atelier A LTDA/);
  assert.match(excel, /a@atelier.test/);
  assert.match(excel, /Ativa/);
  assert.match(excel, /Sim/);

  const emails = buildEmpresaEmailCsv(empresas);
  assert.equal(emails, 'a@atelier.test');
});

test('keeps the name column when restoring visible columns', () => {
  assert.deepEqual(normalizeEmpresaListColumnIds(['phone', 'email']), ['name', 'phone', 'email']);
  assert.deepEqual(normalizeEmpresaListColumnIds(['unknown']), ['name']);
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  branchesOfEmpresa,
  empresaLabel,
  isEmpresaActiveForCombo,
  resolveActiveEmpresaId,
} from '../../frontend/src/components/providers/session-context';

describe('session empresa context', () => {
  const empresas = [
    { id: 'empresa-dev', legalName: 'ANEXSYS DEV LTDA', tradeName: 'ANEXSYS DEV', isDefault: true },
    { id: 'empresa-a', legalName: 'Atelier A LTDA', tradeName: 'Atelier A', isDefault: false },
    { id: 'empresa-b', legalName: 'Atelier B LTDA', tradeName: 'Atelier B', isDefault: false },
  ];
  const branches = [
    { id: 'filial-dev', label: 'Matriz', companyId: 'empresa-dev' },
    { id: 'filial-a', label: 'Matriz A', companyId: 'empresa-a' },
    { id: 'filial-b', label: 'Matriz B', companyId: 'empresa-b' },
  ];

  it('prefers the selected empresa, then the filial ativa, then the default', () => {
    assert.equal(resolveActiveEmpresaId(empresas, branches, 'filial-b', 'empresa-a'), 'empresa-a');
    assert.equal(resolveActiveEmpresaId(empresas, branches, 'filial-b', null), 'empresa-b');
    assert.equal(resolveActiveEmpresaId(empresas, branches, null, null), 'empresa-dev');
  });

  it('lists only filiais of the selected empresa', () => {
    assert.deepEqual(
      branchesOfEmpresa(branches, 'empresa-a').map((branch) => branch.id),
      ['filial-a'],
    );
    assert.equal(empresaLabel(empresas[1]), 'Atelier A');
  });

  it('hides inactive empresas from the context combo', () => {
    assert.equal(isEmpresaActiveForCombo('active'), true);
    assert.equal(isEmpresaActiveForCombo(undefined), true);
    assert.equal(isEmpresaActiveForCombo('inactive'), false);
  });
});

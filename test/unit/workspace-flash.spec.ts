import assert from 'node:assert/strict';
import test from 'node:test';
import { describeWorkspaceError, inferFlashTone } from '../../frontend/src/components/ui/workspace-flash';

test('marks failures as error flashes and confirmations as ok', () => {
  assert.equal(inferFlashTone("Já existe uma Filial com o código MATRIZ nesta Empresa."), 'error');
  assert.equal(inferFlashTone("Branch code 'MATRIZ' already exists for this tenant."), 'error');
  assert.equal(inferFlashTone("A empresa não pôde ser criada."), 'error');
  assert.equal(inferFlashTone("Informe um CEP com 8 dígitos para buscar o endereço."), 'error');
  assert.equal(inferFlashTone("Cannot read properties of undefined (reading 'search')"), 'error');
  assert.equal(inferFlashTone("Empresa criada. A Filial padrão (Matriz) nasceu junto."), 'ok');
  assert.equal(inferFlashTone("Empresa atualizada."), 'ok');
});

test('translates start:dev constructor crashes into a recoverable flash', () => {
  const message = describeWorkspaceError(
    new TypeError("Cannot read properties of undefined (reading 'search')"),
    "Os clientes não puderam ser carregados.",
  );
  assert.match(message, /Os clientes não puderam ser carregados/);
  assert.match(message, /start:dev/);
  assert.equal(inferFlashTone(message), 'error');
});

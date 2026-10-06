import assert from 'node:assert/strict';
import test from 'node:test';
import { filterLookupOptions, shouldShowCreateShortcut } from '../../frontend/src/components/ui/lookup-suggestions';

const options = [
  { id: '1', label: 'Maria Silva', hint: '11988887777' },
  { id: '2', label: 'Ateliê Norte', hint: 'Campinas' },
  { id: '3', label: 'Joana Souza', hint: 'maria@nao' },
];

test('suggests registered records by name or hint', () => {
  assert.deepEqual(
    filterLookupOptions(options, 'maria').map((option) => option.id),
    ['1', '3'],
  );
  assert.deepEqual(
    filterLookupOptions(options, 'campinas').map((option) => option.id),
    ['2'],
  );
});

test('shows Cadastrar only when the typed value has no suggestion', () => {
  assert.equal(shouldShowCreateShortcut('Maria', filterLookupOptions(options, 'Maria'), true), false);
  assert.equal(shouldShowCreateShortcut('Zuleika', filterLookupOptions(options, 'Zuleika'), true), true);
  assert.equal(shouldShowCreateShortcut('Zuleika', filterLookupOptions(options, 'Zuleika'), false), false);
  assert.equal(shouldShowCreateShortcut('', filterLookupOptions(options, ''), true), false);
});

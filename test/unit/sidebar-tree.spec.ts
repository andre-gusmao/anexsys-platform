import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptySidebarTree,
  normalizeSidebarTree,
  SIDEBAR_TREE_STORAGE_KEY,
  toggleTreeId,
} from '../../frontend/src/components/app-shell/sidebar-tree';

test('toggles sidebar tree ids without duplicates', () => {
  assert.deepEqual(toggleTreeId([], 'Cadastros'), ['Cadastros']);
  assert.deepEqual(toggleTreeId(['Cadastros'], 'Cadastros'), []);
  assert.deepEqual(toggleTreeId(['Cadastros'], '/customers'), ['Cadastros', '/customers']);
});

test('normalizes empty and duplicate collapsed tree ids', () => {
  assert.deepEqual(normalizeSidebarTree({ collapsedSections: ['', 'Cadastros', 'Cadastros'], collapsedItems: ['  '] }), {
    collapsedSections: ['Cadastros'],
    collapsedItems: [],
  });
  assert.equal(SIDEBAR_TREE_STORAGE_KEY, 'anexsys.frontend.sidebar-tree.v1');
  assert.deepEqual(createEmptySidebarTree(), { collapsedSections: [], collapsedItems: [] });
});

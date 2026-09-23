import assert from 'node:assert/strict';
import test from 'node:test';
import { buildServiceOrderDetailViewModel } from '../../frontend/src/components/service-orders/service-order-workspace-view-model';

test('buildServiceOrderDetailViewModel formats total and item lines with unit price', () => {
  const viewModel = buildServiceOrderDetailViewModel({
    totalValue: '125.00',
    items: [
      {
        id: 'item-1',
        itemNo: 1,
        itemType: 'Ajuste',
        description: 'Barra da calça',
        quantity: '2.0000',
        unitPrice: '50.00',
        status: 'open',
      },
    ],
  });

  assert.equal(viewModel.hasItems, true);
  assert.equal(viewModel.totalValueDisplay, '125.00');
  assert.deepEqual(viewModel.itemLines, [{ id: 'item-1', line: '#1 · Ajuste · Barra da calça · 2.0000 · 50.00 · open' }]);
});

test('buildServiceOrderDetailViewModel returns empty-state data when there are no items', () => {
  const viewModel = buildServiceOrderDetailViewModel({
    totalValue: null,
    items: [],
  });

  assert.equal(viewModel.hasItems, false);
  assert.equal(viewModel.totalValueDisplay, '—');
  assert.deepEqual(viewModel.itemLines, []);
});

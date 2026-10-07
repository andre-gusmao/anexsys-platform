import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addServiceOrderItemGridRow,
  buildCreateServiceOrderItemsPayload,
  buildServiceOrderItemMutationPlan,
  calculateServiceOrderItemSubtotal,
  canAddServiceOrderItemGridRow,
  mapServiceOrderItemsToGridRows,
  MAX_SERVICE_ORDER_ITEMS,
  removeServiceOrderItemGridRow,
  updateServiceOrderItemGridRow,
} from '../../frontend/src/components/service-orders/service-order-workspace-view-model';

test('maps persisted items into visible editable grid rows', () => {
  const rows = mapServiceOrderItemsToGridRows([
    {
      id: 'item-1',
      itemNo: 1,
      itemType: 'Jeans',
      productId: 'product-1',
      serviceId: 'service-1',
      description: 'Original Hem',
      complement: 'Azul marinho',
      quantity: '1.0000',
      unitPrice: '25.00',
      discountValue: '0.00',
      status: 'open',
    },
    {
      id: 'item-2',
      itemNo: 2,
      itemType: 'Shirt',
      description: 'Sleeve Adjustment',
      quantity: '1.0000',
      unitPrice: null,
      discountValue: null,
      status: 'cancelled',
    },
  ]);

  assert.deepEqual(rows, [
    {
      localId: 'item-1',
      persistedItemId: 'item-1',
      itemNo: 1,
      itemType: 'Jeans',
      productId: 'product-1',
      serviceId: 'service-1',
      description: 'Original Hem',
      complement: 'Azul marinho',
      quantity: '1.0000',
      unitPrice: '25.00',
      discountValue: '0.00',
      status: 'open',
      isEditing: false,
      isNew: false,
      isRemoved: false,
    },
  ]);
});

test('builds create payload for all visible item rows', () => {
  const rows = addServiceOrderItemGridRow([]);
  const updatedRows = updateServiceOrderItemGridRow(rows, rows[0].localId, {
    itemType: 'Party Dress',
    productId: 'product-2',
    serviceId: 'service-2',
    description: 'Hem Adjustment',
    complement: 'Na lateral',
    quantity: '2',
    unitPrice: '80',
    discountValue: '10',
  });

  assert.deepEqual(buildCreateServiceOrderItemsPayload(updatedRows), [
    {
      itemType: 'Party Dress',
      productId: 'product-2',
      serviceId: 'service-2',
      description: 'Hem Adjustment',
      complement: 'Na lateral',
      quantity: 2,
      unitPrice: 80,
      discountValue: 10,
    },
  ]);
});

test('creates update and remove plans for existing rows and create plan for new rows', () => {
  const originalItems = [
    {
      id: 'item-1',
      itemNo: 1,
      itemType: 'Jeans',
      description: 'Original Hem',
      quantity: '1.0000',
      unitPrice: '25.00',
      discountValue: '0.00',
      status: 'open',
    },
  ];

  let rows = mapServiceOrderItemsToGridRows(originalItems);
  rows = updateServiceOrderItemGridRow(rows, 'item-1', {
    description: 'Keep original appearance',
    isEditing: true,
  });
  rows = addServiceOrderItemGridRow(rows);
  rows = updateServiceOrderItemGridRow(rows, 'draft-2', {
    itemType: 'Shirt',
    description: 'Left cuff only',
    quantity: '1',
  });

  const plan = buildServiceOrderItemMutationPlan(rows, originalItems);
  assert.deepEqual(plan, {
    create: [
      {
        itemType: 'Shirt',
        productId: undefined,
        serviceId: undefined,
        description: 'Left cuff only',
        complement: undefined,
        quantity: 1,
        unitPrice: undefined,
        discountValue: undefined,
      },
    ],
    update: [
      {
        itemId: 'item-1',
        itemType: 'Jeans',
        productId: undefined,
        serviceId: undefined,
        description: 'Keep original appearance',
        complement: undefined,
        quantity: 1,
        unitPrice: 25,
        discountValue: 0,
      },
    ],
    remove: [],
  });
});

test('marks persisted rows for removal and removes new rows immediately', () => {
  const originalItems = [
    {
      id: 'item-1',
      itemNo: 1,
      itemType: 'Jeans',
      description: 'Original Hem',
      quantity: '1.0000',
      unitPrice: '25.00',
      discountValue: '0.00',
      status: 'open',
    },
  ];

  let rows = mapServiceOrderItemsToGridRows(originalItems);
  rows = addServiceOrderItemGridRow(rows);
  rows = removeServiceOrderItemGridRow(rows, 'draft-2');
  rows = removeServiceOrderItemGridRow(rows, 'item-1');

  const plan = buildServiceOrderItemMutationPlan(rows, originalItems);
  assert.deepEqual(plan, {
    create: [],
    update: [],
    remove: [{ itemId: 'item-1', status: 'cancelled' }],
  });
});

test('does not emit updates for numerically equivalent values', () => {
  const originalItems = [
    {
      id: 'item-1',
      itemNo: 1,
      itemType: 'Jeans',
      description: 'Original Hem',
      quantity: '1.0000',
      unitPrice: '25.00',
      discountValue: '0.00',
      status: 'open',
    },
  ];

  let rows = mapServiceOrderItemsToGridRows(originalItems);
  rows = updateServiceOrderItemGridRow(rows, 'item-1', {
    quantity: '1',
    unitPrice: '25',
    discountValue: '0',
  });

  const plan = buildServiceOrderItemMutationPlan(rows, originalItems);
  assert.deepEqual(plan, {
    create: [],
    update: [],
    remove: [],
  });
});

test('caps the visible piece count at five and calculates the line subtotal', () => {
  let rows = addServiceOrderItemGridRow([]);
  for (let index = 0; index < MAX_SERVICE_ORDER_ITEMS + 2; index += 1) {
    rows = addServiceOrderItemGridRow(rows);
  }

  assert.equal(rows.length, MAX_SERVICE_ORDER_ITEMS);
  assert.equal(canAddServiceOrderItemGridRow(rows), false);
  assert.equal(
    calculateServiceOrderItemSubtotal({ quantity: '2', unitPrice: '40', discountValue: '10' }),
    70,
  );
});

test('respects a parametrized piece limit when adding rows', () => {
  let rows = addServiceOrderItemGridRow([], 3);
  rows = addServiceOrderItemGridRow(rows, 3);
  rows = addServiceOrderItemGridRow(rows, 3);
  rows = addServiceOrderItemGridRow(rows, 3);

  assert.equal(rows.length, 3);
  assert.equal(canAddServiceOrderItemGridRow(rows, 3), false);
  assert.equal(canAddServiceOrderItemGridRow(rows, 5), true);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { overflowMenuFixedStyle } from '../../frontend/src/components/ui/row-overflow-menu-position';

test('row overflow menu sits over the last grid row instead of opening into a scrollbar', () => {
  const below = overflowMenuFixedStyle(
    { top: 120, bottom: 152, right: 980 },
    { width: 1000, height: 800 },
  );
  assert.equal(below.position, 'fixed');
  assert.equal(below.top, 156);
  assert.equal(below.left, 740);
  assert.equal(below.zIndex, 80);

  const lastRow = overflowMenuFixedStyle(
    { top: 740, bottom: 772, right: 980 },
    { width: 1000, height: 800 },
    { width: 240, height: 168 },
  );
  assert.equal(lastRow.top, 568);
  assert.equal(lastRow.left, 740);
});

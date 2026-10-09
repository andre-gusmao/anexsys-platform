import assert from 'node:assert/strict';
import test from 'node:test';
import { OS_PHOTO_MAX_EDGE, osPhotoDrawSize } from '../../frontend/src/components/service-orders/os-photo';
import { JSON_BODY_LIMIT } from '../../src/platform/http/json-body-limit';

test('OS paper photos shrink to a size the server can accept', () => {
  assert.equal(JSON_BODY_LIMIT, '8mb');
  assert.equal(OS_PHOTO_MAX_EDGE, 1600);
  assert.deepEqual(osPhotoDrawSize(4000, 3000), { width: 1600, height: 1200 });
  assert.deepEqual(osPhotoDrawSize(800, 600), { width: 800, height: 600 });
});

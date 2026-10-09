import assert from 'node:assert/strict';
import test from 'node:test';
import { publicOsBackendUrl } from '../../frontend/src/app/os/[token]/public-os-proxy';

test('the public OS page talks to Nest through a Next proxy, not /backend-api/public', () => {
  assert.equal(
    publicOsBackendUrl('e5bcfbda-286a-4415-ba53-91dd09051fd4'),
    'http://127.0.0.1:3000/api/v1/public/service-orders/e5bcfbda-286a-4415-ba53-91dd09051fd4',
  );
  assert.equal(
    publicOsBackendUrl('e5bcfbda-286a-4415-ba53-91dd09051fd4', '/recebi'),
    'http://127.0.0.1:3000/api/v1/public/service-orders/e5bcfbda-286a-4415-ba53-91dd09051fd4/recebi',
  );
});

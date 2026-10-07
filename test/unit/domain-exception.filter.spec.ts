import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { DomainExceptionFilter } from 'src/platform/http/domain-exception.filter';

function createHost(request: { method?: string; url?: string } = {}) {
  const result: { statusCode?: number; body?: unknown } = {};
  const response = {
    status(statusCode: number) {
      result.statusCode = statusCode;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
  };

  return {
    result,
    host: {
      switchToHttp() {
        return {
          getResponse() {
            return response;
          },
          getRequest() {
            return request;
          },
        };
      },
    },
  };
}

describe('DomainExceptionFilter', () => {
  it('replaces customer validation arrays with a business-friendly message', () => {
    const { host, result } = createHost({ method: 'POST', url: '/api/v1/customers' });

    new DomainExceptionFilter().catch(
      new BadRequestException(['property street should not exist', 'property city should not exist']),
      host as never,
    );

    assert.equal(result.statusCode, 400);
    assert.deepEqual(result.body, {
      message:
        'Customer could not be saved. Some registration fields are missing or invalid. Review name, contact, address, and document information, then try again.',
    });
  });

  it('preserves explicit business bad-request messages', () => {
    const { host, result } = createHost({ method: 'PATCH', url: '/api/v1/customers/customer-1' });

    new DomainExceptionFilter().catch(
      new BadRequestException('Blocked customer lifecycle is outside Sprint 2 scope.'),
      host as never,
    );

    assert.equal(result.statusCode, 400);
    assert.deepEqual(result.body, {
      error: 'Bad Request',
      message: 'Blocked customer lifecycle is outside Sprint 2 scope.',
      statusCode: 400,
    });
  });

  it('translates the tsx Reflector login crash into a recoverable message', () => {
    const { host, result } = createHost({ method: 'POST', url: '/api/v1/auth/login/password' });

    new DomainExceptionFilter().catch(
      new TypeError("Cannot read properties of undefined (reading 'getAllAndOverride')"),
      host as never,
    );

    assert.equal(result.statusCode, 500);
    assert.match(String((result.body as { message?: string }).message), /start:dev/);
  });

  it('translates the tsx login limiter crash into a recoverable message', () => {
    const { host, result } = createHost({ method: 'POST', url: '/api/v1/auth/login/password' });

    new DomainExceptionFilter().catch(
      new TypeError("Cannot read properties of undefined (reading 'assertAllowed')"),
      host as never,
    );

    assert.equal(result.statusCode, 500);
    assert.match(String((result.body as { message?: string }).message), /start:dev/);
  });

  it('translates a missing database column into a recoverable start:dev message', () => {
    const { host, result } = createHost({ method: 'GET', url: '/api/v1/service-orders' });

    new DomainExceptionFilter().catch(
      new Error('coluna service_order.promised_delivery_time não existe'),
      host as never,
    );

    assert.equal(result.statusCode, 500);
    assert.match(String((result.body as { message?: string }).message), /banco está desatualizado/);
    assert.match(String((result.body as { message?: string }).message), /start:dev/);
  });

  it('translates a tsx customer search crash into a recoverable message', () => {
    const { host, result } = createHost({ method: 'GET', url: '/api/v1/customers' });

    new DomainExceptionFilter().catch(
      new TypeError("Cannot read properties of undefined (reading 'search')"),
      host as never,
    );

    assert.equal(result.statusCode, 500);
    assert.match(String((result.body as { message?: string }).message), /start:dev/);
  });
});

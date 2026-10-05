import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LoginAttemptLimiterService } from 'src/modules/identity/application/auth/login-attempt-limiter.service';

function createLimiter(clock: { now: number }) {
  return new LoginAttemptLimiterService({
    maxFailuresPerEmailAndAddress: 3,
    maxFailuresPerEmail: 6,
    windowMs: 10 * 60 * 1000,
    blockMs: 10 * 60 * 1000,
    now: () => clock.now,
  });
}

function assertBlocked(action: () => void) {
  assert.throws(action, (error: unknown) => {
    assert.ok(error instanceof HttpException);
    assert.equal(error.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
    return true;
  });
}

describe('LoginAttemptLimiterService', () => {
  it('allows attempts below the failure limit', () => {
    const limiter = createLimiter({ now: 0 });
    limiter.recordFailure('ana@example.com', '10.0.0.1');
    limiter.recordFailure('ana@example.com', '10.0.0.1');
    limiter.assertAllowed('ana@example.com', '10.0.0.1');
  });

  it('blocks after too many failures from the same email and address', () => {
    const limiter = createLimiter({ now: 0 });
    for (let i = 0; i < 3; i += 1) {
      limiter.recordFailure('ana@example.com', '10.0.0.1');
    }
    assertBlocked(() => limiter.assertAllowed('ana@example.com', '10.0.0.1'));
  });

  it('does not block the same email from a different address until the email limit is reached', () => {
    const limiter = createLimiter({ now: 0 });
    for (let i = 0; i < 3; i += 1) {
      limiter.recordFailure('ana@example.com', '10.0.0.1');
    }
    limiter.assertAllowed('ana@example.com', '10.0.0.2');
  });

  it('blocks an email attacked from many addresses', () => {
    const limiter = createLimiter({ now: 0 });
    for (let i = 0; i < 6; i += 1) {
      limiter.recordFailure('ana@example.com', `10.0.0.${i}`);
    }
    assertBlocked(() => limiter.assertAllowed('ana@example.com', '10.9.9.9'));
  });

  it('treats email case and spaces as the same account', () => {
    const limiter = createLimiter({ now: 0 });
    for (let i = 0; i < 3; i += 1) {
      limiter.recordFailure(' ANA@Example.com ', '10.0.0.1');
    }
    assertBlocked(() => limiter.assertAllowed('ana@example.com', '10.0.0.1'));
  });

  it('releases the block after the block period', () => {
    const clock = { now: 0 };
    const limiter = createLimiter(clock);
    for (let i = 0; i < 3; i += 1) {
      limiter.recordFailure('ana@example.com', '10.0.0.1');
    }
    clock.now = 10 * 60 * 1000 + 1;
    limiter.assertAllowed('ana@example.com', '10.0.0.1');
  });

  it('forgets failures after a successful login', () => {
    const limiter = createLimiter({ now: 0 });
    limiter.recordFailure('ana@example.com', '10.0.0.1');
    limiter.recordFailure('ana@example.com', '10.0.0.1');
    limiter.recordSuccess('ana@example.com', '10.0.0.1');
    limiter.recordFailure('ana@example.com', '10.0.0.1');
    limiter.recordFailure('ana@example.com', '10.0.0.1');
    limiter.assertAllowed('ana@example.com', '10.0.0.1');
  });

  it('reports a friendly message in Portuguese', () => {
    const limiter = createLimiter({ now: 0 });
    for (let i = 0; i < 3; i += 1) {
      limiter.recordFailure('ana@example.com', null);
    }
    try {
      limiter.assertAllowed('ana@example.com', null);
      assert.fail('deveria bloquear');
    } catch (error) {
      assert.ok(error instanceof HttpException);
      const response = error.getResponse() as { message: string };
      assert.match(response.message, /Muitas tentativas de login/);
    }
  });
});

import { HttpException, HttpStatus, Inject, Injectable, Optional } from '@nestjs/common';

interface AttemptRecord {
  failures: number;
  windowStartedAt: number;
  blockedUntil: number | null;
}

export interface LoginAttemptLimiterOptions {
  maxFailuresPerEmailAndAddress: number;
  maxFailuresPerEmail: number;
  windowMs: number;
  blockMs: number;
  now: () => number;
}

export const LOGIN_ATTEMPT_LIMITER_OPTIONS = 'LOGIN_ATTEMPT_LIMITER_OPTIONS';

const DEFAULT_OPTIONS: LoginAttemptLimiterOptions = {
  maxFailuresPerEmailAndAddress: 5,
  maxFailuresPerEmail: 20,
  windowMs: 15 * 60 * 1000,
  blockMs: 15 * 60 * 1000,
  now: () => Date.now(),
};

/**
 * Limite simples de tentativas de login, guardado em memoria.
 * Vale por instancia do servidor: com mais de uma instancia, cada uma conta separado.
 */
@Injectable()
export class LoginAttemptLimiterService {
  private readonly options: LoginAttemptLimiterOptions;
  private readonly records = new Map<string, AttemptRecord>();

  constructor(
    @Optional() @Inject(LOGIN_ATTEMPT_LIMITER_OPTIONS) options?: Partial<LoginAttemptLimiterOptions>,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...(options ?? {}) };
  }

  assertAllowed(email: string, address: string | null): void {
    this.pruneExpired();
    const blockedUntil = Math.max(
      this.getBlockedUntil(this.emailAndAddressKey(email, address)),
      this.getBlockedUntil(this.emailKey(email)),
    );

    if (blockedUntil > this.options.now()) {
      const retryAfterSeconds = Math.max(1, Math.ceil((blockedUntil - this.options.now()) / 1000));
      throw new HttpException(
        {
          message: `Muitas tentativas de login. Tente novamente em ${Math.ceil(retryAfterSeconds / 60)} minuto(s).`,
          retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(email: string, address: string | null): void {
    this.registerFailure(this.emailAndAddressKey(email, address), this.options.maxFailuresPerEmailAndAddress);
    this.registerFailure(this.emailKey(email), this.options.maxFailuresPerEmail);
  }

  recordSuccess(email: string, address: string | null): void {
    this.records.delete(this.emailAndAddressKey(email, address));
    this.records.delete(this.emailKey(email));
  }

  private registerFailure(key: string, maxFailures: number): void {
    const now = this.options.now();
    const current = this.records.get(key);
    const record: AttemptRecord =
      current && now - current.windowStartedAt <= this.options.windowMs
        ? current
        : { failures: 0, windowStartedAt: now, blockedUntil: null };

    record.failures += 1;
    if (record.failures >= maxFailures) {
      record.blockedUntil = now + this.options.blockMs;
    }

    this.records.set(key, record);
  }

  private getBlockedUntil(key: string): number {
    return this.records.get(key)?.blockedUntil ?? 0;
  }

  private pruneExpired(): void {
    const now = this.options.now();
    for (const [key, record] of this.records) {
      const windowExpired = now - record.windowStartedAt > this.options.windowMs;
      const blockExpired = !record.blockedUntil || record.blockedUntil <= now;
      if (windowExpired && blockExpired) {
        this.records.delete(key);
      }
    }
  }

  private emailAndAddressKey(email: string, address: string | null): string {
    return `ea:${email.trim().toLowerCase()}|${address ?? 'unknown'}`;
  }

  private emailKey(email: string): string {
    return `e:${email.trim().toLowerCase()}`;
  }
}

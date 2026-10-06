/**
 * Neon recusa conexão sem SSL. O pg também barra URL com channel_binding
 * se faltar sslmode=require — mesmo quando o objeto `ssl` está setado.
 */
export function ensureSslModeRequire(url: string): string {
  const trimmed = url.trim();
  if (/[?&]sslmode=/i.test(trimmed)) {
    return trimmed.replace(/([?&]sslmode=)(disable|allow|prefer)(?=&|$)/i, '$1require');
  }
  return `${trimmed}${trimmed.includes('?') ? '&' : '?'}sslmode=require`;
}

export function resolveRemoteSsl(databaseUrl?: string): { rejectUnauthorized: boolean } | undefined {
  const explicit = (process.env.DB_SSL ?? '').toLowerCase();
  if (explicit === 'false' || explicit === '0' || explicit === 'off') {
    return undefined;
  }

  if (databaseUrl || explicit === 'true' || explicit === '1' || explicit === 'on') {
    return {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    };
  }

  return undefined;
}

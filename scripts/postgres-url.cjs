function ensureSslModeRequire(url) {
  const trimmed = String(url).trim();
  if (/[?&]sslmode=/i.test(trimmed)) {
    return trimmed.replace(/([?&]sslmode=)(disable|allow|prefer)(?=&|$)/i, '$1require');
  }
  return `${trimmed}${trimmed.includes('?') ? '&' : '?'}sslmode=require`;
}

function applyDatabaseUrlSsl() {
  if (!process.env.DATABASE_URL) {
    return;
  }
  process.env.DATABASE_URL = ensureSslModeRequire(process.env.DATABASE_URL);
  if (!process.env.DB_SSL) {
    process.env.DB_SSL = 'true';
  }
}

module.exports = { ensureSslModeRequire, applyDatabaseUrlSsl };

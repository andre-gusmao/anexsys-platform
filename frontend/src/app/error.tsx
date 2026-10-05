"use client";

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <div className="screen-shell">
      <section className="auth-card">
        <div className="auth-card__header">
          <div className="eyebrow">ANEXSYS · Error handling</div>
          <h1 className="title">Something went wrong</h1>
          <p className="subtitle">Sprint 1 includes a global error surface so early navigation and session issues stay understandable.</p>
        </div>

        <div className="auth-card__body">
          <div className="error-banner">
            <strong>{error.name || "Application error"}</strong>
            <span>{error.message || "Unexpected UI failure."}</span>
          </div>
          <div className="button-row">
            <button className="button" onClick={reset} type="button">
              Retry
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

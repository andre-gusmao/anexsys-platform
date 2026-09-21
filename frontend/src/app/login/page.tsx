"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login, status, knownTenants, errorMessage, clearError } = useSession();
  const [tenantId, setTenantId] = useState(knownTenants[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedTenantHint = useMemo(
    () => knownTenants.find((tenant) => tenant.id === tenantId)?.hint,
    [knownTenants, tenantId],
  );

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
      return;
    }
    if (status === "branch-selection") {
      router.replace("/select-branch");
    }
  }, [router, status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    clearError();
    try {
      await login({ tenantId, email, password });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen-shell">
      <section className="auth-card">
        <div className="auth-card__header">
          <div className="eyebrow">ANEXSYS · Sprint 1</div>
          <h1 className="title">Administrative login</h1>
          <p className="subtitle">
            First usable frontend iteration with tenant selection, authentication flow, session context, branch selection, and
            role-aware shell navigation.
          </p>
        </div>

        <div className="auth-card__body">
          <form className="form-grid" onSubmit={handleSubmit}>
            {errorMessage ? (
              <div className="error-banner">
                <strong>Authentication failed</strong>
                <span>{errorMessage}</span>
                <button className="button-ghost" onClick={clearError} type="button">
                  Dismiss
                </button>
              </div>
            ) : null}

            {knownTenants.length > 0 ? (
              <div className="field">
                <label htmlFor="knownTenant">Known tenant</label>
                <select id="knownTenant" value={tenantId} onChange={(event) => setTenantId(event.target.value)}>
                  {knownTenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.label}
                    </option>
                  ))}
                </select>
                {selectedTenantHint ? <span className="field__hint">{selectedTenantHint}</span> : null}
              </div>
            ) : null}

            <div className="field">
              <label htmlFor="tenantId">Tenant ID</label>
              <input
                id="tenantId"
                name="tenantId"
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
                placeholder="Tenant UUID required by /auth/login/password"
                required
              />
              <span className="field__hint">
                Sprint 1 uses a manual or preconfigured tenant selector because the current backend does not expose a public tenant
                discovery endpoint.
              </span>
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@tenant.test"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </div>

            <div className="button-row">
              <button className="button" disabled={submitting} type="submit">
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

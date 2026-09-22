"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login, status, errorMessage, clearError } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      await login({ email, password });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen-shell">
      <section className="auth-card">
        <div className="auth-card__header">
          <div className="eyebrow">ANEXSYS</div>
          <h1 className="title">Administrative login</h1>
          <p className="subtitle">
            Sign in with your email and password. Company and branch open automatically when possible.
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

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@company.test"
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

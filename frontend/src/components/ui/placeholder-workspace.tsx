"use client";

import type { ReactNode } from "react";

type PlaceholderWorkspaceProps = {
  title: string;
  description: string;
  bullets: string[];
  aside?: ReactNode;
};

export function PlaceholderWorkspace({ title, description, bullets, aside }: Readonly<PlaceholderWorkspaceProps>) {
  return (
    <>
      <section className="hero-card">
        <div className="eyebrow">Frontend Sprint 1</div>
        <h1 className="title">{title}</h1>
        <p>{description}</p>
      </section>

      <section className="card-grid">
        <article className="mini-card">
          <h3>Current scope</h3>
          <ul className="placeholder-list">
            {bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </article>
        <article className="mini-card">
          <h3>Implementation note</h3>
          <p>
            This screen is intentionally a placeholder in Sprint 1. The shell, session context, authentication flow, and
            role-aware navigation are ready so the team can validate UX structure before deeper domain work begins.
          </p>
        </article>
        {aside ? <article className="mini-card">{aside}</article> : null}
      </section>
    </>
  );
}

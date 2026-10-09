"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type HoverPeekProps = {
  text?: string | null;
  children: ReactNode;
  className?: string;
};

export function HoverPeek({ text, children, className }: HoverPeekProps) {
  const trimmed = (text ?? "").trim();
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !wrapRef.current) {
      return;
    }
    const rect = wrapRef.current.getBoundingClientRect();
    const maxWidth = Math.min(360, window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - maxWidth - 8);
    const below = rect.bottom + 8;
    const top = below + 88 > window.innerHeight ? Math.max(8, rect.top - 96) : below;
    setPos({ top, left });
  }, [open, trimmed]);

  if (!trimmed) {
    return <>{children}</>;
  }

  const show = () => {
    if (wrapRef.current?.contains(document.activeElement)) {
      return;
    }
    setOpen(true);
  };

  return (
    <span
      className={`hover-peek${className ? ` ${className}` : ""}`}
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
      ref={wrapRef}
    >
      {children}
      {open ? (
        <span className="hover-peek__tip" role="tooltip" style={{ left: pos.left, top: pos.top }}>
          {trimmed}
        </span>
      ) : null}
    </span>
  );
}

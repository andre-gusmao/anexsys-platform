"use client";

import { useEffect, useRef, useState } from "react";

export type RowMenuItem = {
  id: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  children?: RowMenuItem[];
  onSelect?: () => void;
};

type Props = {
  items: RowMenuItem[];
  label: string;
};

export function RowOverflowMenu({ items, label }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [openChild, setOpenChild] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setOpenChild(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="row-overflow" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className="row-overflow__trigger"
        onClick={() => {
          setOpen((current) => !current);
          setOpenChild(null);
        }}
        type="button"
      >
        ⋮
      </button>
      {open ? (
        <ul className="row-overflow__menu" role="menu">
          {items.map((item) => (
            <li key={item.id}>
              {item.children?.length ? (
                <div className="row-overflow__group">
                  <button
                    aria-expanded={openChild === item.id}
                    className="row-overflow__item"
                    disabled={item.disabled}
                    onClick={() => setOpenChild((current) => (current === item.id ? null : item.id))}
                    type="button"
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true">▸</span>
                  </button>
                  {openChild === item.id ? (
                    <ul className="row-overflow__submenu">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <button
                            className={`row-overflow__item${child.danger ? " row-overflow__item--danger" : ""}`}
                            disabled={child.disabled}
                            onClick={() => {
                              child.onSelect?.();
                              setOpen(false);
                              setOpenChild(null);
                            }}
                            type="button"
                          >
                            {child.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <button
                  className={`row-overflow__item${item.danger ? " row-overflow__item--danger" : ""}`}
                  disabled={item.disabled}
                  onClick={() => {
                    item.onSelect?.();
                    setOpen(false);
                  }}
                  type="button"
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

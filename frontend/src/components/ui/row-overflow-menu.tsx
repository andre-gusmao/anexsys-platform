"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  OVERFLOW_MENU_ESTIMATED_HEIGHT,
  OVERFLOW_MENU_WIDTH,
  overflowMenuFixedStyle,
} from "@/components/ui/row-overflow-menu-position";

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

export { overflowMenuFixedStyle };

export function RowOverflowMenu({ items, label }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);
  const [open, setOpen] = useState(false);
  const [openChild, setOpenChild] = useState<string | null>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

  const updateMenuStyle = () => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const measuredHeight = menuRef.current?.offsetHeight || OVERFLOW_MENU_ESTIMATED_HEIGHT;
    setMenuStyle(
      overflowMenuFixedStyle(
        rect,
        { width: window.innerWidth, height: window.innerHeight },
        { width: OVERFLOW_MENU_WIDTH, height: measuredHeight },
      ),
    );
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
      setOpenChild(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }
    updateMenuStyle();
    const onReposition = () => updateMenuStyle();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, openChild]);

  if (items.length === 0) {
    return null;
  }

  const menu = open && menuStyle && typeof document !== "undefined"
    ? createPortal(
        <ul className="row-overflow__menu row-overflow__menu--portal" ref={menuRef} role="menu" style={menuStyle}>
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
        </ul>,
        document.body,
      )
    : null;

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
        ref={triggerRef}
        type="button"
      >
        ⋮
      </button>
      {menu}
    </div>
  );
}

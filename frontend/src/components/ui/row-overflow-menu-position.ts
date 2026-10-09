export const OVERFLOW_MENU_WIDTH = 240;
export const OVERFLOW_MENU_ESTIMATED_HEIGHT = 168;

export function overflowMenuFixedStyle(
  trigger: { top: number; bottom: number; right: number },
  viewport: { width: number; height: number },
  menu: { width: number; height: number } = {
    width: OVERFLOW_MENU_WIDTH,
    height: OVERFLOW_MENU_ESTIMATED_HEIGHT,
  },
) {
  const gap = 4;
  const margin = 8;
  const spaceBelow = viewport.height - trigger.bottom - margin;
  const spaceAbove = trigger.top - margin;
  const openUp = spaceBelow < menu.height && spaceAbove > spaceBelow;
  const left = Math.min(
    Math.max(margin, trigger.right - menu.width),
    Math.max(margin, viewport.width - menu.width - margin),
  );
  return {
    position: "fixed" as const,
    left,
    top: openUp ? Math.max(margin, trigger.top - menu.height - gap) : trigger.bottom + gap,
    width: menu.width,
    zIndex: 80,
  };
}

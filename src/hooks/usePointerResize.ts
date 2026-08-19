import { useCallback, useEffect, useRef, useState } from "react";
import {
  getStoredCartListHeightPercent,
  getStoredCartWidthPercent,
  saveCartListHeightPercent,
  saveCartWidthPercent,
  SALE_LAYOUT_DEFAULTS,
  SALE_LAYOUT_LIMITS,
} from "@/lib/saleLayoutStorage";

type ResizeAxis = "width" | "height";

type ActiveResize = {
  axis: ResizeAxis;
  pointerId: number;
  startPointer: number;
  startValue: number;
  containerSize: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function useSaleLayoutResize() {
  const cartPanelRef = useRef<HTMLDivElement>(null);
  const cartListRef = useRef<HTMLDivElement>(null);
  const cartColumnRef = useRef<HTMLDivElement>(null);
  const activeResizeRef = useRef<ActiveResize | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingValueRef = useRef<number | null>(null);

  const [cartWidthPercent, setCartWidthPercent] = useState<number>(
    SALE_LAYOUT_DEFAULTS.cartWidthPercent,
  );
  const [cartListHeightPercent, setCartListHeightPercent] = useState<number>(
    SALE_LAYOUT_DEFAULTS.cartListHeightPercent,
  );

  const applyCartWidth = useCallback((percent: number) => {
    const panel = cartPanelRef.current;
    if (!panel) return;
    panel.style.width = `${percent}%`;
  }, []);

  const applyCartListHeight = useCallback((percent: number) => {
    const list = cartListRef.current;
    if (!list) return;
    list.style.flexBasis = `${percent}%`;
    list.style.flexGrow = "0";
    list.style.flexShrink = "0";
    list.style.height = `${percent}%`;
    list.style.maxHeight = `${percent}%`;
  }, []);

  useEffect(() => {
    const width = getStoredCartWidthPercent();
    const height = getStoredCartListHeightPercent();
    setCartWidthPercent(width);
    setCartListHeightPercent(height);
    applyCartWidth(width);
    applyCartListHeight(height);
  }, [applyCartListHeight, applyCartWidth]);

  const flushPending = useCallback(() => {
    rafRef.current = null;
    const active = activeResizeRef.current;
    const next = pendingValueRef.current;
    if (!active || next == null) return;

    if (active.axis === "width") {
      applyCartWidth(next);
    } else {
      applyCartListHeight(next);
    }
  }, [applyCartListHeight, applyCartWidth]);

  const scheduleApply = useCallback(
    (value: number) => {
      pendingValueRef.current = value;
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(flushPending);
    },
    [flushPending],
  );

  const finishResize = useCallback(() => {
    const active = activeResizeRef.current;
    const next = pendingValueRef.current;
    activeResizeRef.current = null;

    if (active && next != null) {
      if (active.axis === "width") {
        setCartWidthPercent(next);
        saveCartWidthPercent(next);
      } else {
        setCartListHeightPercent(next);
        saveCartListHeightPercent(next);
      }
    }

    pendingValueRef.current = null;
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const active = activeResizeRef.current;
      if (!active || event.pointerId !== active.pointerId) return;

      if (active.axis === "width") {
        const delta = event.clientX - active.startPointer;
        const nextPercent =
          active.startValue + (delta / active.containerSize) * 100;
        scheduleApply(
          clamp(
            nextPercent,
            SALE_LAYOUT_LIMITS.cartWidthMin,
            SALE_LAYOUT_LIMITS.cartWidthMax,
          ),
        );
        return;
      }

      const delta = event.clientY - active.startPointer;
      const nextPercent =
        active.startValue + (delta / active.containerSize) * 100;
      scheduleApply(
        clamp(
          nextPercent,
          SALE_LAYOUT_LIMITS.cartListHeightMin,
          SALE_LAYOUT_LIMITS.cartListHeightMax,
        ),
      );
    },
    [scheduleApply],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      const active = activeResizeRef.current;
      if (!active || event.pointerId !== active.pointerId) return;
      finishResize();
    },
    [finishResize],
  );

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [onPointerMove, onPointerUp]);

  const startWidthResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const shell = cartPanelRef.current?.parentElement;
      if (!shell) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      activeResizeRef.current = {
        axis: "width",
        pointerId: event.pointerId,
        startPointer: event.clientX,
        startValue: cartWidthPercent,
        containerSize: shell.getBoundingClientRect().width,
      };
    },
    [cartWidthPercent],
  );

  const startHeightResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const column = cartColumnRef.current;
      if (!column) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      const headerHeight =
        column.querySelector("[data-sale-cart-header]")?.getBoundingClientRect()
          .height ?? 0;
      const containerSize = column.getBoundingClientRect().height - headerHeight;

      activeResizeRef.current = {
        axis: "height",
        pointerId: event.pointerId,
        startPointer: event.clientY,
        startValue: cartListHeightPercent,
        containerSize: Math.max(containerSize, 1),
      };
    },
    [cartListHeightPercent],
  );

  const reapplyLayout = useCallback(() => {
    applyCartWidth(cartWidthPercent);
    applyCartListHeight(cartListHeightPercent);
  }, [
    applyCartListHeight,
    applyCartWidth,
    cartListHeightPercent,
    cartWidthPercent,
  ]);

  return {
    cartPanelRef,
    cartListRef,
    cartColumnRef,
    cartWidthPercent,
    cartListHeightPercent,
    startWidthResize,
    startHeightResize,
    reapplyLayout,
  };
}

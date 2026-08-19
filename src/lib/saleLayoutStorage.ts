const CART_WIDTH_KEY = "pos-sale-cart-width-v1";
const CART_LIST_HEIGHT_KEY = "pos-sale-cart-list-height-v1";

export const SALE_LAYOUT_DEFAULTS = {
  cartWidthPercent: 35,
  cartListHeightPercent: 58,
} as const;

export const SALE_LAYOUT_LIMITS = {
  cartWidthMin: 25,
  cartWidthMax: 50,
  cartListHeightMin: 30,
  cartListHeightMax: 75,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function readNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore quota errors
  }
}

export function getStoredCartWidthPercent(): number {
  return clamp(
    readNumber(CART_WIDTH_KEY, SALE_LAYOUT_DEFAULTS.cartWidthPercent),
    SALE_LAYOUT_LIMITS.cartWidthMin,
    SALE_LAYOUT_LIMITS.cartWidthMax,
  );
}

export function getStoredCartListHeightPercent(): number {
  return clamp(
    readNumber(CART_LIST_HEIGHT_KEY, SALE_LAYOUT_DEFAULTS.cartListHeightPercent),
    SALE_LAYOUT_LIMITS.cartListHeightMin,
    SALE_LAYOUT_LIMITS.cartListHeightMax,
  );
}

export function saveCartWidthPercent(value: number) {
  writeNumber(
    CART_WIDTH_KEY,
    clamp(value, SALE_LAYOUT_LIMITS.cartWidthMin, SALE_LAYOUT_LIMITS.cartWidthMax),
  );
}

export function saveCartListHeightPercent(value: number) {
  writeNumber(
    CART_LIST_HEIGHT_KEY,
    clamp(
      value,
      SALE_LAYOUT_LIMITS.cartListHeightMin,
      SALE_LAYOUT_LIMITS.cartListHeightMax,
    ),
  );
}

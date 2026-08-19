import type { ThaiProduct } from "@/features/thai/thai.types";

export interface ThaiCartLine {
  localId: string;
  productId: string;
  productName: string;
  productCode: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  description: string;
}

export type AddToCartResult = "added" | "max_stock" | "unchanged";

export function tryAddToCart(
  lines: ThaiCartLine[],
  product: ThaiProduct,
): { lines: ThaiCartLine[]; result: AddToCartResult } {
  const existing = lines.find((line) => line.productId === product.id);
  const stockQty = product.stockQty;

  if (existing) {
    if (existing.quantity >= stockQty) {
      return { lines, result: "max_stock" };
    }
    return {
      lines: lines.map((line) =>
        line.productId === product.id
          ? { ...line, quantity: line.quantity + 1 }
          : line,
      ),
      result: "added",
    };
  }

  if (stockQty <= 0 || !product.isActive) {
    return { lines, result: "max_stock" };
  }

  return {
    lines: [
      ...lines,
      {
        localId: `${product.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: product.id,
        productName: product.name,
        productCode: product.productCode,
        barcode: product.barcode,
        quantity: 1,
        unitPrice: 0,
        description: product.description ?? product.name,
      },
    ],
    result: "added",
  };
}

export const SALE_CLEAR_CART_EVENT = "sale:clear-cart";

export function dispatchSaleClearCart() {
  window.dispatchEvent(new CustomEvent(SALE_CLEAR_CART_EVENT));
}

const CART_STORAGE_KEY = "thai-pos-sale-cart-v1";

export function loadPersistedCart(): ThaiCartLine[] {
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ThaiCartLine[];
  } catch {
    return [];
  }
}

export function persistCart(lines: ThaiCartLine[]) {
  try {
    if (lines.length === 0) {
      sessionStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // ignore quota errors
  }
}

export function clearPersistedCart() {
  sessionStorage.removeItem(CART_STORAGE_KEY);
}

export function getLineTotal(line: Pick<ThaiCartLine, "quantity" | "unitPrice">): number {
  return line.quantity * line.unitPrice;
}

export function getCartSubtotal(lines: Pick<ThaiCartLine, "quantity" | "unitPrice">[]): number {
  return lines.reduce((sum, line) => sum + getLineTotal(line), 0);
}

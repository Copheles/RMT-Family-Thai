import type { ThaiProduct } from "@/features/thai/thai.types";

export const PACKAGE_GROSS_PADDING_LB = 50;

export interface PackageCartLine {
  localId: string;
  productId: string;
  productName: string;
  productCode: string;
  description: string;
  weightLb: number;
  noOfPackages: number;
  qtyTotal: string;
  grossWeightAddLb: number;
}

export function computeNetWeightLb(line: Pick<PackageCartLine, "weightLb" | "noOfPackages">): number {
  return line.weightLb * line.noOfPackages;
}

export function computeGrossWeightLb(
  line: Pick<PackageCartLine, "weightLb" | "noOfPackages" | "grossWeightAddLb">,
): number {
  const addLb = line.grossWeightAddLb ?? PACKAGE_GROSS_PADDING_LB;
  return computeNetWeightLb(line) + addLb;
}

export function formatWeightLb(value: number): string {
  return `${value.toFixed(2)} LB`;
}

export function parseQtyTon(value: string): number {
  const n = Number(value.trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function formatQtyTon(value: number): string {
  const rounded = Number(value.toFixed(2));
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(2)} TON`;
}

export function cartTotalQtyTon(lines: PackageCartLine[]): number {
  return lines.reduce((sum, line) => sum + parseQtyTon(line.qtyTotal), 0);
}

export function addProductToPackageCart(
  lines: PackageCartLine[],
  product: ThaiProduct,
): PackageCartLine[] {
  if (!product.isActive) return lines;

  const existing = lines.find((line) => line.productId === product.id);
  if (existing) {
    return lines.map((line) =>
      line.productId === product.id
        ? { ...line, noOfPackages: line.noOfPackages + 1 }
        : line,
    );
  }

  return [
    ...lines,
    {
      localId: `${product.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: product.id,
      productName: product.name,
      productCode: product.productCode,
      description: product.description ?? product.name,
      weightLb: product.weightLb,
      noOfPackages: 1,
      qtyTotal: "",
      grossWeightAddLb: PACKAGE_GROSS_PADDING_LB,
    },
  ];
}

const CART_STORAGE_KEY = "thai-pos-package-cart-v1";

export function loadPersistedPackageCart(): PackageCartLine[] {
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const lines = JSON.parse(raw) as PackageCartLine[];
    return lines.map((line) => ({
      ...line,
      grossWeightAddLb: line.grossWeightAddLb ?? PACKAGE_GROSS_PADDING_LB,
    }));
  } catch {
    return [];
  }
}

export function persistPackageCart(lines: PackageCartLine[]) {
  try {
    if (lines.length === 0) {
      sessionStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // ignore
  }
}

export function clearPersistedPackageCart() {
  sessionStorage.removeItem(CART_STORAGE_KEY);
}

export function cartTotals(lines: PackageCartLine[]) {
  const totalNet = lines.reduce((sum, line) => sum + computeNetWeightLb(line), 0);
  const totalGross = lines.reduce((sum, line) => sum + computeGrossWeightLb(line), 0);
  return { totalNet, totalGross };
}

const LB_TO_KG = 0.453592;

export function formatWeightKg(lb: number): string {
  const kg = Math.round(lb * LB_TO_KG);
  return `${kg.toLocaleString("en-US")} KG`;
}

export function formatPackages(count: number): string {
  return `${count} BAG`;
}

export function formatPdfDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function listTotalQtyLabel(
  list: { totalQtyLabel: string | null; items: Array<{ qtyTotal: string }> },
): string {
  if (list.totalQtyLabel) return list.totalQtyLabel;
  const total = list.items.reduce((sum, item) => sum + parseQtyTon(item.qtyTotal), 0);
  return total > 0 ? formatQtyTon(total) : "—";
}

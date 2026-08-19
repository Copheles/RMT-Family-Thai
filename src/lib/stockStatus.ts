export type StockStatus = "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK";

export function getStockStatus(qty: number, lowThreshold = 5): StockStatus {
  if (qty <= 0) return "OUT_OF_STOCK";
  if (qty <= lowThreshold) return "LOW_STOCK";
  return "IN_STOCK";
}

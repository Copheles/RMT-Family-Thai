export const PAGE_SIZE = {
  saleProducts: 20,
  invoices: 10,
  expenses: 10,
  exchanges: 10,
  inventoryProducts: 25,
  vendors: 20,
  customers: 10,
  batches: 10,
} as const;

export const PAGE_SIZE_OPTIONS = {
  saleProducts: [12, 20, 32, 48] as const,
  invoices: [10, 20, 50] as const,
  expenses: [10, 20, 50] as const,
  exchanges: [10, 20, 50] as const,
  inventoryProducts: [25, 50] as const,
  vendors: [10, 20, 50] as const,
  customers: [10, 20, 50] as const,
  batches: [10, 20, 50] as const,
} as const;

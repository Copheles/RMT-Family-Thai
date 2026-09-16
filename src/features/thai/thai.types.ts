import type { PaginatedResult } from "@/types/api";

export type ThaiPaymentType = "DEBIT" | "CREDIT" | "CHECK" | "CASH" | "ZELLE";
export type PaymentStatus = "PAID" | "DEBIT";
export type ExchangeType = "IMPORT" | "EXPORT" | "OTHER";

export interface ThaiSettings {
  id: string;
  companyName: string;
  address: string;
  cityZip: string;
  phone: string;
  email: string;
}

export interface ThaiVendor {
  id: string;
  name: string;
  companyNo: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  isActive: boolean;
}

export interface ThaiCustomer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface ThaiExpense {
  id: string;
  name: string;
  price: number;
  date: string;
}

export interface ThaiCategory {
  id: string;
  name: string;
}

export interface ThaiProduct {
  id: string;
  name: string;
  barcode: string;
  description: string | null;
  weightLb: number;
  productCode: string;
  stockQty: number;
  categoryId: string | null;
  category: ThaiCategory | null;
  isActive: boolean;
}

export interface ThaiInvoiceItem {
  id: string;
  productId: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  product: { id: string; name: string; barcode: string; productCode: string };
}

export interface ThaiInvoicePayment {
  id: string;
  paymentType: ThaiPaymentType;
  paidAmount: number;
  note: string | null;
  createdAt: string;
}

export interface ThaiInvoiceRefundItem {
  id: string;
  invoiceItemId: string;
  productId: string;
  quantity: number;
  unitRefundAmount: number;
  lineRefundAmount: number;
  restock: boolean;
}

export interface ThaiInvoiceRefund {
  id: string;
  paymentType: ThaiPaymentType;
  amount: number;
  note: string | null;
  createdAt: string;
  items: ThaiInvoiceRefundItem[];
}

export interface ThaiInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  customerId: string;
  customer: { id: string; name: string; phone: string };
  purchaseOrderDate: string | null;
  companyName: string;
  companyAddress: string;
  companyCityZip: string;
  companyPhone: string;
  companyEmail: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeCityZip: string;
  consigneePhone: string;
  consigneeEmail: string;
  billToName: string;
  billToAddress: string;
  billToCityZip: string;
  billToPhone: string;
  billToEmail: string;
  policyText: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  paymentType: ThaiPaymentType;
  paymentStatus?: PaymentStatus;
  paidTotal?: number;
  refundedTotal?: number;
  balanceDue?: number;
  notes: string | null;
  items: ThaiInvoiceItem[];
  payments?: ThaiInvoicePayment[];
  refunds?: ThaiInvoiceRefund[];
}

export interface ThaiOutstandingRow {
  customer: { id: string; name: string; phone: string };
  invoice: {
    id: string;
    invoiceNo: string;
    totalAmount: number;
    paidTotal: number;
    refundedTotal: number;
    balanceDue: number;
    createdAt: string;
  };
}

export interface CreateThaiInvoicePayload {
  customerId: string;
  date?: string;
  purchaseOrderDate?: string | null;
  consigneeName: string;
  consigneeAddress: string;
  consigneeCityZip: string;
  consigneePhone: string;
  consigneeEmail: string;
  billToName: string;
  billToAddress: string;
  billToCityZip: string;
  billToPhone: string;
  billToEmail: string;
  policyText?: string;
  taxAmount?: number;
  discountAmount?: number;
  deliveryFee?: number;
  paymentType: ThaiPaymentType;
  paymentStatus: PaymentStatus;
  notes?: string;
  items: Array<{
    productId: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface ThaiExchange {
  id: string;
  name: string;
  amountMmk: number;
  rateMmkPerUsd: number;
  senderName: string;
  receiverName: string;
  type: ExchangeType;
  date: string;
}

export interface ThaiSaleReportProduct {
  productId: string;
  name: string;
  qty: number;
  gross: number;
  net: number;
  profit: number;
}

export interface ThaiSaleReportPayment {
  paymentType: ThaiPaymentType;
  count: number;
  totalAmount: number;
}

export interface ThaiSaleReport {
  invoiceCount: number;
  totalSales: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  soldQty: number;
  grossSales: number;
  netSales: number;
  profit: number;
  products: ThaiSaleReportProduct[];
  byPaymentType: ThaiSaleReportPayment[];
}

export interface ThaiSummaryReport {
  sales: ThaiSaleReport;
  orders: number;
  soldQty: number;
  cashInHand: number;
  expenseCount: number;
  totalExpenses: number;
  net: number;
  expensesByName: Array<{ name: string; amount: number }>;
  activeProducts: number;
  activeCustomers: number;
}

export interface ThaiPackageListItem {
  id: string;
  productId: string;
  serialNo: number;
  noOfPackages: number;
  description: string;
  productCode: string;
  hsCode: string | null;
  qtyTotal: string;
  netWeightLb: number;
  grossWeightLb: number;
  product: { id: string; name: string; barcode: string; productCode: string; weightLb: number };
}

export interface ThaiPackageList {
  id: string;
  listNo: string;
  date: string;
  companyName: string;
  companyAddress: string;
  companyCityZip: string;
  companyPhone: string;
  companyEmail: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeCityZip: string | null;
  consigneeCountry: string | null;
  consigneePostalCode: string | null;
  consigneeContactPerson: string | null;
  consigneePhone: string | null;
  consigneeEmail: string | null;
  invoiceNo: string | null;
  invoiceDate: string | null;
  piNo: string | null;
  piDate: string | null;
  iecNo: string | null;
  gstin: string | null;
  contractNo: string | null;
  contractDate: string | null;
  notifyParty: string | null;
  preCarriageBy: string | null;
  placeOfReceipt: string | null;
  countryOfOrigin: string | null;
  countryOfFinalDestination: string | null;
  vesselFlightNo: string | null;
  portOfLoading: string | null;
  portOfDischarge: string | null;
  finalDestination: string | null;
  containerNo: string | null;
  sealNo: string | null;
  lotNo: string | null;
  packingDetail: string | null;
  totalNetWeightLb: number;
  totalGrossWeightLb: number;
  totalQtyLabel: string | null;
  items: ThaiPackageListItem[];
}

export interface CreateThaiPackageListPayload {
  date?: string;
  companyName: string;
  companyAddress: string;
  companyCityZip?: string;
  companyPhone?: string;
  companyEmail?: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeCityZip?: string;
  consigneeCountry?: string;
  consigneePostalCode?: string;
  consigneeContactPerson?: string;
  consigneePhone?: string;
  consigneeEmail?: string;
  piNo?: string;
  piDate?: string | null;
  iecNo?: string;
  gstin?: string;
  contractNo?: string;
  contractDate?: string | null;
  notifyParty?: string;
  preCarriageBy?: string;
  placeOfReceipt?: string;
  countryOfOrigin?: string;
  countryOfFinalDestination?: string;
  vesselFlightNo?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  finalDestination?: string;
  containerNo?: string;
  sealNo?: string;
  lotNo?: string;
  packingDetail?: string;
  totalQtyLabel?: string;
  items: Array<{
    productId: string;
    noOfPackages: number;
    description?: string;
    productCode: string;
    qtyTotal: string;
    netWeightLb: number;
    grossWeightLb: number;
  }>;
}

export type ListResponse<T> = PaginatedResult<T>;

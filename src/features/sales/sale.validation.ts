import { z } from "zod";

export const lineEditSchema = z.object({
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  description: z.string(),
});

export type LineEditFormValues = z.infer<typeof lineEditSchema>;

const partySchema = z.object({
  name: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
  cityZip: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
});

export const invoiceDetailsSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  purchaseOrderDate: z.string().optional(),
  consignee: partySchema,
  billTo: partySchema,
  policyText: z.string(),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  deliveryFee: z.number().min(0),
  paymentType: z.enum(["CASH", "DEBIT", "CREDIT", "CHECK", "ZELLE"]),
  notes: z.string(),
});

export type InvoiceDetailsFormValues = z.infer<typeof invoiceDetailsSchema>;

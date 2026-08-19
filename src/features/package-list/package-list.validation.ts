import { z } from "zod";

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const packageListDetailsSchema = z.object({
  listDate: z.string().min(1, "List date is required"),
  companyName: z.string().trim().min(1, "Exporter company name is required"),
  companyAddress: z.string().trim().min(1, "Exporter address is required"),
  companyCityZip: z.string().trim().optional(),
  companyPhone: z.string().trim().optional(),
  companyEmail: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  consigneeName: z.string().trim().min(1, "Consignee company name is required"),
  consigneeAddress: z.string().trim().min(1, "Consignee address is required"),
  consigneeCityZip: z.string().trim().optional(),
  consigneeCountry: z.string().trim().optional(),
  consigneePostalCode: z.string().trim().optional(),
  consigneeContactPerson: z.string().trim().optional(),
  consigneePhone: z.string().trim().optional(),
  consigneeEmail: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  piNo: z.string().trim().optional(),
  piDate: z.string().trim().optional(),
  iecNo: z.string().trim().optional(),
  gstin: z.string().trim().optional(),
  contractNo: z.string().trim().optional(),
  contractDate: z.string().trim().optional(),
  notifyParty: z.string().trim().optional(),
  preCarriageBy: z.string().trim().optional(),
  placeOfReceipt: z.string().trim().optional(),
  countryOfOrigin: z.string().trim().optional(),
  countryOfFinalDestination: z.string().trim().optional(),
  vesselFlightNo: z.string().trim().optional(),
  portOfLoading: z.string().trim().optional(),
  portOfDischarge: z.string().trim().optional(),
  finalDestination: z.string().trim().optional(),
});

export type PackageListDetailsFormValues = z.infer<typeof packageListDetailsSchema>;

export const packageListDetailsDefaultValues: PackageListDetailsFormValues = {
  listDate: todayIsoDate(),
  companyName: "",
  companyAddress: "",
  companyCityZip: "",
  companyPhone: "",
  companyEmail: "",
  consigneeName: "",
  consigneeAddress: "",
  consigneeCityZip: "",
  consigneeCountry: "",
  consigneePostalCode: "",
  consigneeContactPerson: "",
  consigneePhone: "",
  consigneeEmail: "",
  piNo: "",
  piDate: "",
  iecNo: "",
  gstin: "",
  contractNo: "",
  contractDate: "",
  notifyParty: "",
  preCarriageBy: "",
  placeOfReceipt: "",
  countryOfOrigin: "",
  countryOfFinalDestination: "",
  vesselFlightNo: "",
  portOfLoading: "",
  portOfDischarge: "",
  finalDestination: "",
};

export const packageLineEditSchema = z.object({
  noOfPackages: z.number().int().min(1, "At least one package is required"),
  qtyTotal: z
    .string()
    .trim()
    .min(1, "Qty total is required")
    .regex(/^\d+(\.\d+)?$/, "Enter quantity in tons (numbers only)"),
  grossWeightAddLb: z.number().min(0, "Gross weight add must be 0 or more"),
  description: z.string().trim().min(1, "Description is required"),
});

export type PackageLineEditFormValues = z.infer<typeof packageLineEditSchema>;

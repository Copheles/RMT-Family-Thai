import { z } from "zod";

export const passwordSettingsSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type PasswordSettingsFormValues = z.infer<typeof passwordSettingsSchema>;

export const invoiceSenderSettingsSchema = z.object({
  companyName: z.string().trim().min(1, "From name is required"),
  address: z.string().trim(),
  cityZip: z.string().trim(),
  phone: z.string().trim(),
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "Invalid email",
    }),
});

export type InvoiceSenderSettingsFormValues = z.infer<typeof invoiceSenderSettingsSchema>;

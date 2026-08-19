import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(128, "Username must be 128 characters or less")
    .trim(),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must be 128 characters or less"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

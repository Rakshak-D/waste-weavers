import { z } from "zod";

const emailSchema = z.string().trim().email().max(254);

export const registrationSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(100),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Za-z]/, "Password must contain a letter.")
      .regex(/[0-9]/, "Password must contain a number."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

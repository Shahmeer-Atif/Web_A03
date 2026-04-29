// Zod schemas for the auth surface. These are imported by the client form
// (react-hook-form) AND by the server API route — single source of truth.

import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-zA-Z]/, "Must contain a letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

export const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

const profileFields = {
  id: z.string().uuid(),
  email: z.string().email().nullable().optional(),
  fullName: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  role: z.string().default("member"),
  teamName: z.string().nullable().optional(),
  teamLogoUrl: z.string().nullable().optional(),
  companyPhone: z.string().nullable().optional(),
  companyEmail: z.string().email().nullable().optional(),
  companyAddress: z.string().nullable().optional(),
  invoicePrefix: z.string().nullable().default("INV-"),
  paymentTermsDays: z.number().default(30),
  warrantyBlurb: z.string().nullable().optional(),
  notifyEmail: z.boolean().default(true),
  notifySms: z.boolean().default(false),
  voiceAssistantEnabled: z.boolean().default(true),
  voiceWakeWord: z.string().nullable().optional(),
  theme: z.string().nullable().optional(),
  brandColor: z.string().nullable().optional(),
}

export const insertProfileSchema = z.object({
  ...profileFields,
  id: z.string().uuid(),
})
export const selectProfileSchema = z.object(profileFields)

import { z } from "zod";

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

export const evmAddressSchema = z
  .string()
  .trim()
  .regex(EVM_ADDRESS_REGEX, "Must be a valid EVM address (e.g. 0x1234...5678)");

export const txHashSchema = z
  .string()
  .trim()
  .regex(TX_HASH_REGEX, "Must be a valid 66-character 0x hex transaction hash");

export const createInvoiceSchema = z.object({
  client_name: z
    .string()
    .trim()
    .min(2, "Client name must be at least 2 characters")
    .max(100, "Client name must be less than 100 characters"),
  client_email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .min(3, "Description must be at least 3 characters")
    .max(500, "Description must be less than 500 characters"),
  amount: z
    .string()
    .trim()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Amount must be a positive number greater than 0")
    .refine((val) => {
      // Must not have more than 6 decimal places
      const parts = val.split(".");
      return parts.length <= 1 || parts[1].length <= 6;
    }, "USDC amount cannot exceed 6 decimal places"),
  due_date: z
    .string()
    .min(1, "Due date is required"),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be under 1000 characters")
    .optional()
    .or(z.literal("")),
  receiving_wallet_address: evmAddressSchema,
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = z.object({
  client_name: z.string().trim().min(2).max(100).optional(),
  client_email: z.string().trim().email().optional().or(z.literal("")),
  description: z.string().trim().min(3).max(500).optional(),
  due_date: z.string().optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  status: z.enum(["draft", "pending", "canceled"]).optional(),
});

export const verifyPaymentSchema = z.object({
  invoice_number: z.string().trim().min(3, "Valid invoice number is required"),
  transaction_hash: txHashSchema,
  payer_wallet_address: evmAddressSchema.optional(),
});

export const authSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().trim().max(100).optional(),
  business_name: z.string().trim().max(100).optional(),
});

export const profileSchema = z.object({
  full_name: z.string().trim().max(100).optional().or(z.literal("")),
  business_name: z.string().trim().max(100).optional().or(z.literal("")),
  default_wallet_address: evmAddressSchema.optional().or(z.literal("")),
});

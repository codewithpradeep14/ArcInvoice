import { describe, it, expect } from "vitest";
import {
  createInvoiceSchema,
  verifyPaymentSchema,
  evmAddressSchema,
  txHashSchema,
} from "@/lib/validations";

describe("Invoice and Payment Validation Schemas", () => {
  const validAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
  const validTxHash =
    "0x" + "a".repeat(64);

  it("validates compliant invoice creation data", () => {
    const validData = {
      client_name: "Acme Corporation",
      client_email: "billing@acme.com",
      description: "Frontend architecture milestone",
      amount: "1500.50",
      due_date: "2026-11-01",
      notes: "Payment due in USDC on Arc",
      receiving_wallet_address: validAddress,
    };

    const result = createInvoiceSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid EVM addresses", () => {
    expect(evmAddressSchema.safeParse("invalid-address").success).toBe(false);
    expect(evmAddressSchema.safeParse("0x123").success).toBe(false);
    expect(evmAddressSchema.safeParse(validAddress).success).toBe(true);
  });

  it("rejects non-compliant transaction hashes", () => {
    expect(txHashSchema.safeParse("0x123").success).toBe(false);
    expect(txHashSchema.safeParse("short-hash").success).toBe(false);
    expect(txHashSchema.safeParse(validTxHash).success).toBe(true);
  });

  it("rejects amounts with more than 6 decimal places", () => {
    const invalidAmountData = {
      client_name: "Acme Corporation",
      description: "Test task",
      amount: "100.1234567", // 7 decimals
      due_date: "2026-11-01",
      receiving_wallet_address: validAddress,
    };

    const result = createInvoiceSchema.safeParse(invalidAmountData);
    expect(result.success).toBe(false);
  });

  it("rejects non-positive amounts", () => {
    const zeroAmountData = {
      client_name: "Acme Corporation",
      description: "Test task",
      amount: "0",
      due_date: "2026-11-01",
      receiving_wallet_address: validAddress,
    };

    expect(createInvoiceSchema.safeParse(zeroAmountData).success).toBe(false);
  });

  it("validates payment verification payload", () => {
    const validVerify = {
      invoice_number: "ARC-2026-ABCD",
      transaction_hash: validTxHash,
      payer_wallet_address: validAddress,
    };

    expect(verifyPaymentSchema.safeParse(validVerify).success).toBe(true);
  });
});

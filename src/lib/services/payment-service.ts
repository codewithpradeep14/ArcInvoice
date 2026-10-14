import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyOnChainTransaction } from "@/lib/arc/verification";
import { getExplorerTxUrl, getActiveNetworkConfig } from "@/config/arc";
import type { VerificationResult, Payment } from "@/types";

export interface VerifyPaymentInput {
  invoice_number: string;
  transaction_hash: string;
  payer_wallet_address?: string;
}

/**
 * Robust, idempotent payment verification service.
 * Independently reads the Arc blockchain, checks logs and statuses, and records verified payments.
 */
export async function verifyAndRecordPayment(
  input: VerifyPaymentInput
): Promise<VerificationResult> {
  const adminClient = createAdminClient();
  const config = getActiveNetworkConfig();

  // 1. Fetch the authoritative invoice from database
  const { data: invoiceRows, error: fetchError } = await adminClient
    .from("invoices")
    .select("id, invoice_number, amount_minor, receiving_wallet_address, status")
    .eq("invoice_number", input.invoice_number)
    .limit(1);

  if (fetchError || !invoiceRows || invoiceRows.length === 0) {
    return {
      success: false,
      status: "failed",
      transaction_hash: input.transaction_hash,
      error: "Invoice not found.",
    };
  }

  const invoice = invoiceRows[0];

  // 2. Reject if invoice is canceled
  if (invoice.status === "canceled") {
    return {
      success: false,
      status: "failed",
      transaction_hash: input.transaction_hash,
      error: "This invoice has been canceled and can no longer accept payments.",
    };
  }

  // 3. Check if already marked as paid with this transaction hash (Idempotency)
  const { data: existingPayments } = await adminClient
    .from("payments")
    .select("*")
    .eq("transaction_hash", input.transaction_hash)
    .limit(1);

  if (existingPayments && existingPayments.length > 0) {
    const existing = existingPayments[0];
    return {
      success: true,
      status: "paid",
      transaction_hash: input.transaction_hash,
      already_confirmed: true,
      block_number: existing.block_number || undefined,
      confirmed_at: existing.confirmed_at || undefined,
      explorer_url: getExplorerTxUrl(input.transaction_hash),
    };
  }

  // 4. Independently verify on-chain result using Arc RPC
  const verification = await verifyOnChainTransaction({
    transactionHash: input.transaction_hash as `0x${string}`,
    expectedRecipient: invoice.receiving_wallet_address,
    expectedAmountMinor: BigInt(invoice.amount_minor),
    expectedTokenContract: config.usdcContractAddress,
  });

  if (!verification.isValid) {
    // If transaction reverted
    if (verification.status === "reverted") {
      // Record failure in audit log
      await adminClient.from("audit_logs").insert({
        invoice_id: invoice.id,
        event_type: "payment_reverted",
        metadata: {
          transaction_hash: input.transaction_hash,
          error: verification.error,
        },
      });

      return {
        success: false,
        status: "reverted",
        transaction_hash: input.transaction_hash,
        error: "The transaction was reverted on the Arc blockchain.",
        explorer_url: getExplorerTxUrl(input.transaction_hash),
      };
    }

    // If transaction is still pending or not yet found
    if (verification.status === "pending") {
      return {
        success: false,
        status: "pending",
        transaction_hash: input.transaction_hash,
        error: verification.error || "Transaction is pending confirmation on Arc.",
        explorer_url: getExplorerTxUrl(input.transaction_hash),
      };
    }

    // Invalid details (e.g. wrong amount, wrong recipient)
    return {
      success: false,
      status: "failed",
      transaction_hash: input.transaction_hash,
      error: verification.error || "On-chain transaction details did not match invoice requirements.",
      explorer_url: getExplorerTxUrl(input.transaction_hash),
    };
  }

  // 5. On-chain validation PASSED. Atomically record the verified payment via PostgreSQL RPC.
  const payerWallet = verification.payer || input.payer_wallet_address || "0x0000000000000000000000000000000000000000";

  const { data: recordResult, error: rpcError } = await adminClient.rpc(
    "record_verified_payment",
    {
      p_invoice_number: input.invoice_number,
      p_payer_wallet: payerWallet,
      p_recipient_wallet: verification.recipient,
      p_token_contract: verification.tokenContract,
      p_amount_minor: verification.amountMinor.toString(),
      p_transaction_hash: input.transaction_hash,
      p_block_number: Number(verification.blockNumber),
    }
  );

  if (rpcError) {
    return {
      success: false,
      status: "failed",
      transaction_hash: input.transaction_hash,
      error: `Failed to record verified payment: ${rpcError.message}`,
    };
  }

  return {
    success: true,
    status: "paid",
    transaction_hash: input.transaction_hash,
    block_number: Number(verification.blockNumber),
    confirmed_at: new Date().toISOString(),
    explorer_url: getExplorerTxUrl(input.transaction_hash),
  };
}

/**
 * Retrieves payment history for the authenticated user.
 */
export async function getUserPaymentHistory(userId: string): Promise<{
  payments: Array<Payment & { invoices?: { invoice_number: string; client_name: string } }>;
  error?: string;
}> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      invoice_id,
      payer_wallet_address,
      recipient_wallet_address,
      token_contract_address,
      amount_minor,
      transaction_hash,
      block_number,
      verification_status,
      confirmed_at,
      created_at,
      invoices!inner(invoice_number, client_name, user_id)
    `)
    .eq("invoices.user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { payments: [], error: error.message };
  }

  return { payments: (data || []) as unknown as Array<Payment & { invoices?: { invoice_number: string; client_name: string } }> };
}

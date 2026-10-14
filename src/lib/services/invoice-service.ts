import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { usdcToMinor } from "@/lib/utils";
import type { Invoice, PublicInvoice, DashboardMetrics, InvoiceStatus } from "@/types";
import type { CreateInvoiceFormData } from "@/lib/validations";

/**
 * Generates an unguessable yet professional invoice identifier.
 * Example: ARC-2026-A8K9
 */
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestampPart = Date.now().toString(36).substring(4).toUpperCase();
  return `ARC-${year}-${randomChars}${timestampPart}`.slice(0, 16);
}

/**
 * Creates a new invoice for an authenticated user.
 */
export async function createInvoice(
  userId: string,
  data: CreateInvoiceFormData
): Promise<{ invoice?: Invoice; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const invoiceNumber = generateInvoiceNumber();
  const amountMinor = usdcToMinor(data.amount);

  const newInvoice = {
    invoice_number: invoiceNumber,
    user_id: userId,
    client_name: data.client_name,
    client_email: data.client_email || null,
    description: data.description,
    amount_minor: amountMinor.toString(),
    currency: "USDC",
    receiving_wallet_address: data.receiving_wallet_address,
    network_identifier: "arc-mainnet",
    status: "pending" as InvoiceStatus,
    due_date: new Date(data.due_date).toISOString(),
    notes: data.notes || null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("invoices")
    .insert(newInvoice)
    .select()
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  // Audit log entry
  await supabase.from("audit_logs").insert({
    user_id: userId,
    invoice_id: inserted.id,
    event_type: "invoice_created",
    metadata: {
      invoice_number: invoiceNumber,
      amount_minor: amountMinor.toString(),
      client_name: data.client_name,
    },
  });

  return { invoice: inserted as Invoice };
}

/**
 * Lists invoices owned by the authenticated user with optional search and status filtering.
 */
export async function getUserInvoices(
  userId: string,
  options: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ invoices: Invoice[]; totalCount: number; error?: string }> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("invoices")
    .select("*, payments(*)", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options.search) {
    const s = `%${options.search}%`;
    query = query.or(`invoice_number.ilike.${s},client_name.ilike.${s},description.ilike.${s}`);
  }

  if (options.limit) {
    const offset = options.offset || 0;
    query = query.range(offset, offset + options.limit - 1);
  }

  const { data, count, error } = await query;

  if (error) {
    return { invoices: [], totalCount: 0, error: error.message };
  }

  return {
    invoices: (data || []) as Invoice[],
    totalCount: count || 0,
  };
}

/**
 * Retrieves a single invoice owned by the authenticated user.
 */
export async function getInvoiceById(
  id: string,
  userId: string
): Promise<{ invoice?: Invoice; error?: string }> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*, payments(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { invoice: data as Invoice };
}

/**
 * Cancels an eligible unpaid invoice.
 */
export async function cancelInvoice(
  id: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  // Verify invoice state
  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !invoice) {
    return { success: false, error: "Invoice not found or access denied." };
  }

  if (invoice.status === "paid") {
    return { success: false, error: "Cannot cancel a paid invoice." };
  }

  if (invoice.status === "canceled") {
    return { success: true }; // Already canceled
  }

  const { error: updateError } = await supabase
    .from("invoices")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: userId,
    invoice_id: id,
    event_type: "invoice_canceled",
    metadata: { reason: "User requested cancellation" },
  });

  return { success: true };
}

/**
 * Safe public invoice retrieval by invoice_number.
 * Uses PostgreSQL SECURITY DEFINER function to expose only non-sensitive payment fields.
 */
export async function getPublicInvoiceByNumber(
  invoiceNumber: string
): Promise<{ invoice?: PublicInvoice; error?: string }> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc("get_public_invoice", {
    p_invoice_number: invoiceNumber,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return { error: "Invoice not found" };
  }

  return { invoice: data[0] as PublicInvoice };
}

/**
 * Calculates dashboard metrics for the authenticated user from real database records.
 */
export async function getUserDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const supabase = await createServerSupabaseClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, amount_minor, status, due_date, created_at, client_name, invoice_number, description")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const invoiceList = invoices || [];
  const now = Date.now();

  let totalInvoicedMinor = 0n;
  let totalConfirmedMinor = 0n;
  let outstandingMinor = 0n;
  let overdueCount = 0;
  let paidInvoiceCount = 0;
  let pendingInvoiceCount = 0;

  for (const inv of invoiceList) {
    const amount = BigInt(inv.amount_minor);
    totalInvoicedMinor += amount;

    if (inv.status === "paid") {
      totalConfirmedMinor += amount;
      paidInvoiceCount += 1;
    } else if (inv.status === "pending" || inv.status === "draft") {
      outstandingMinor += amount;
      pendingInvoiceCount += 1;

      const due = new Date(inv.due_date).getTime();
      if (due < now) {
        overdueCount += 1;
      }
    }
  }

  return {
    totalInvoicedMinor,
    totalConfirmedMinor,
    outstandingMinor,
    overdueCount,
    totalInvoiceCount: invoiceList.length,
    paidInvoiceCount,
    pendingInvoiceCount,
    recentInvoices: invoiceList.slice(0, 5) as unknown as Invoice[],
  };
}

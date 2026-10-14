import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyAndRecordPayment } from "@/lib/services/payment-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleReconcile(request);
}

export async function POST(request: Request) {
  return handleReconcile(request);
}

async function handleReconcile(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const providedSecret =
    searchParams.get("secret") || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // Find all payments that are still marked as 'pending'
  const { data: pendingPayments, error: fetchError } = await adminClient
    .from("payments")
    .select("id, transaction_hash, invoice_id, invoices(invoice_number)")
    .eq("verification_status", "pending")
    .limit(20);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const results: Array<{ tx: string; status: string }> = [];

  for (const pay of pendingPayments || []) {
    const invNumber = (pay.invoices as unknown as { invoice_number: string })?.invoice_number;
    if (invNumber && pay.transaction_hash) {
      try {
        const verifyRes = await verifyAndRecordPayment({
          invoice_number: invNumber,
          transaction_hash: pay.transaction_hash,
        });
        results.push({ tx: pay.transaction_hash, status: verifyRes.status });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error";
        results.push({ tx: pay.transaction_hash, status: `error: ${message}` });
      }
    }
  }

  return NextResponse.json({
    reconciledCount: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}

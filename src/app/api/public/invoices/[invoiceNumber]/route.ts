import { NextResponse } from "next/server";
import { getPublicInvoiceByNumber } from "@/lib/services/invoice-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { invoiceNumber: string } }
) {
  try {
    const { invoiceNumber } = params;

    if (!invoiceNumber) {
      return NextResponse.json({ error: "Invoice number is required" }, { status: 400 });
    }

    const result = await getPublicInvoiceByNumber(invoiceNumber);

    if (result.error || !result.invoice) {
      return NextResponse.json(
        { error: result.error || "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.invoice);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

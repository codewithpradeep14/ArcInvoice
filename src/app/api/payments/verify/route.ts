import { NextResponse } from "next/server";
import { verifyPaymentSchema } from "@/lib/validations";
import { verifyAndRecordPayment } from "@/lib/services/payment-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = verifyPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const verificationResult = await verifyAndRecordPayment(validation.data);

    if (!verificationResult.success) {
      // 422 Unprocessable Entity for invalid tx or verification errors, or 200 with status='pending'
      const httpStatus = verificationResult.status === "pending" ? 202 : 400;
      return NextResponse.json(verificationResult, { status: httpStatus });
    }

    return NextResponse.json(verificationResult, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

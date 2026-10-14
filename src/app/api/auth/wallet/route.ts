import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, signature, message } = body;

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // 1. Verify EVM signature if provided
    if (signature && message) {
      const isValid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid cryptographic signature" },
          { status: 401 }
        );
      }
    }

    // 2. Generate deterministic wallet email & internal credentials
    const cleanAddress = address.toLowerCase();
    const walletEmail = `wallet_${cleanAddress.slice(2, 10)}_${cleanAddress.slice(-6)}@wallet.arcinvoice.internal`;
    const walletPassword = `ArcWallet_${cleanAddress.slice(2, 18)}!2026`;

    const admin = createAdminClient();
    const supabase = await createServerSupabaseClient();

    // 3. Find or create user
    let userId: string | null = null;

    // Check if user already exists
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email === walletEmail || u.user_metadata?.wallet_address === cleanAddress
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user in Supabase
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: walletEmail,
        password: walletPassword,
        email_confirm: true,
        user_metadata: {
          wallet_address: cleanAddress,
          full_name: `Wallet ${cleanAddress.slice(0, 6)}...${cleanAddress.slice(-4)}`,
        },
      });

      if (createError) {
        console.error("Create user error:", createError);
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        );
      }

      userId = newUser.user.id;

      // Create initial profile
      await admin.from("profiles").upsert({
        id: userId,
        email: walletEmail,
        full_name: `User ${cleanAddress.slice(0, 6)}...${cleanAddress.slice(-4)}`,
        business_name: `Arc Studio (${cleanAddress.slice(0, 6)})`,
        default_wallet_address: cleanAddress,
        updated_at: new Date().toISOString(),
      });
    }

    // 4. Authenticate the user session on the server
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email: walletEmail,
      password: walletPassword,
    });

    if (signInError) {
      // If password changed, update password via admin and sign in again
      await admin.auth.admin.updateUserById(userId, { password: walletPassword });
      const retry = await supabase.auth.signInWithPassword({
        email: walletEmail,
        password: walletPassword,
      });

      if (retry.error) {
        return NextResponse.json(
          { error: retry.error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      user_id: userId,
      wallet_address: cleanAddress,
      redirect: "/dashboard",
    });
  } catch (err: any) {
    console.error("Wallet auth error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to authenticate wallet" },
      { status: 500 }
    );
  }
}

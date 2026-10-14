import { NextResponse } from "next/server";
import { validateNetworkConfig, getActiveNetworkConfig } from "@/config/arc";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const config = getActiveNetworkConfig();
  const networkValidation = validateNetworkConfig();

  // Test database connectivity
  let dbHealthy = false;
  let dbLatencyMs = 0;
  try {
    const dbStart = Date.now();
    const admin = createAdminClient();
    const { error } = await admin.from("invoices").select("id").limit(1);
    dbLatencyMs = Date.now() - dbStart;
    dbHealthy = !error;
  } catch {
    dbHealthy = false;
  }

  // Test RPC connectivity (Arc RPC)
  let rpcHealthy = false;
  let rpcLatencyMs = 0;
  try {
    const rpcStart = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(config.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_chainId",
        params: [],
        id: 1,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    rpcLatencyMs = Date.now() - rpcStart;
    rpcHealthy = res.ok;
  } catch {
    rpcHealthy = false;
  }

  const overallStatus = dbHealthy && networkValidation.valid ? "healthy" : "degraded";

  return NextResponse.json(
    {
      status: overallStatus,
      uptimeSeconds: process.uptime ? Math.floor(process.uptime()) : 0,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      network: {
        configuredChainId: config.chainId,
        chainName: config.chainName,
        isTestnet: config.isTestnet,
        usdcContract: config.usdcContractAddress,
        decimals: config.usdcDecimals,
        rpcHealthy,
        rpcLatencyMs,
        validation: networkValidation,
      },
      database: {
        healthy: dbHealthy,
        latencyMs: dbLatencyMs,
      },
    },
    { status: overallStatus === "healthy" ? 200 : 503 }
  );
}

import React, { useState } from "react";
import { useAccount, useWriteContract, useSwitchChain, usePublicClient } from "@/components/providers/web3-provider";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { ERC20_ABI, getActiveNetworkConfig, getExplorerTxUrl } from "@/config/arc";
import { formatUsdcDisplay, shortenAddress, shortenTxHash } from "@/lib/utils";
import confetti from "canvas-confetti";
import type { PublicInvoice, VerificationResult } from "@/types";

interface PayInvoiceButtonProps {
  invoice: PublicInvoice;
  onPaymentSuccess?: (result: VerificationResult) => void;
}

type PaymentStep =
  | "idle"
  | "switching_network"
  | "requesting_signature"
  | "waiting_mining"
  | "verifying_backend"
  | "success"
  | "error";

export function PayInvoiceButton({
  invoice,
  onPaymentSuccess,
}: PayInvoiceButtonProps) {
  const { address, isConnected, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const network = getActiveNetworkConfig();

  const [step, setStep] = useState<PaymentStep>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedTxHash, setSubmittedTxHash] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const isWrongNetwork = isConnected && chain?.id !== network.chainId;
  const isPayable = invoice.status === "pending" || invoice.status === "draft";

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // In case canvas-confetti is not loaded in SSR
    }
  };

  const handlePay = async () => {
    setErrorMessage(null);

    // 1. Validate payment preconditions
    if (!isConnected || !address) {
      setErrorMessage("Please connect an EVM wallet first.");
      return;
    }

    if (!isPayable) {
      setErrorMessage(`Invoice cannot be paid because it is currently "${invoice.status}".`);
      return;
    }

    try {
      // 2. Ensure user is on the correct Arc Network
      if (chain?.id !== network.chainId) {
        setStep("switching_network");
        await switchChainAsync({ chainId: network.chainId });
      }

      // 3. Prompt user for ERC-20 USDC transfer
      setStep("requesting_signature");
      const amountMinor = BigInt(invoice.amount_minor);
      const recipient = invoice.receiving_wallet_address as `0x${string}`;

      const txHash = await writeContractAsync({
        address: network.usdcContractAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipient, amountMinor],
      });

      setSubmittedTxHash(txHash);
      setStep("waiting_mining");

      // 4. Wait for receipt on-chain using viem publicClient if available
      if (publicClient) {
        try {
          await publicClient.waitForTransactionReceipt({
            hash: txHash,
            confirmations: 1,
            timeout: 30_000,
          });
        } catch (waitErr) {
          console.warn("waitForTransactionReceipt timed out or warned, proceeding to backend check:", waitErr);
        }
      }

      // 5. Backend Independent Verification
      setStep("verifying_backend");

      let verified = false;
      let attempts = 0;
      let lastResult: VerificationResult | null = null;

      while (!verified && attempts < 8) {
        attempts++;
        try {
          const res = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              invoice_number: invoice.invoice_number,
              transaction_hash: txHash,
              payer_wallet_address: address,
            }),
          });

          const data: VerificationResult = await res.json();
          lastResult = data;

          if (res.ok && data.success && data.status === "paid") {
            verified = true;
            setVerificationResult(data);
            setStep("success");
            triggerConfetti();
            if (onPaymentSuccess) {
              onPaymentSuccess(data);
            }
            return;
          } else if (data.status === "reverted") {
            setStep("error");
            setErrorMessage("Transaction was reverted on the Arc blockchain.");
            return;
          }
        } catch {
          // Retry on network glitch
        }

        // Wait 2.5 seconds before next polling verification attempt
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }

      if (!verified) {
        setStep("error");
        setErrorMessage(
          lastResult?.error ||
            "Transaction submitted to Arc, but verification is taking longer than expected. Please check your transaction hash on the explorer."
        );
      }
    } catch (err: unknown) {
      setStep("error");
      const errStr = (err as Error)?.message || String(err);

      if (errStr.includes("User rejected") || errStr.includes("denied transaction signature")) {
        setErrorMessage("Transaction signature was rejected in your wallet.");
      } else if (errStr.includes("insufficient funds") || errStr.includes("exceeds balance")) {
        setErrorMessage("Insufficient USDC or gas balance in your wallet to complete payment.");
      } else {
        setErrorMessage(errStr);
      }
    }
  };

  if (!isPayable) {
    return (
      <div className="rounded-lg bg-slate-100 p-4 text-center text-sm text-slate-600">
        This invoice is marked as <strong className="capitalize">{invoice.status}</strong> and cannot be paid.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Network Notice */}
      {isWrongNetwork && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Your wallet is connected to an unsupported network. Please switch to{" "}
            <strong>{network.chainName}</strong> to pay.
          </span>
        </div>
      )}

      {/* Main Action Button */}
      <Button
        variant="primary"
        size="lg"
        onClick={handlePay}
        disabled={step === "switching_network" || step === "requesting_signature" || step === "waiting_mining" || step === "verifying_backend" || step === "success"}
        className="w-full text-base font-semibold shadow-md py-6 flex items-center justify-center gap-2"
      >
        {step === "switching_network" && (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Switching Network to Arc...
          </>
        )}
        {step === "requesting_signature" && (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Confirm in Wallet...
          </>
        )}
        {step === "waiting_mining" && (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Settling on Arc Blockchain...
          </>
        )}
        {step === "verifying_backend" && (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Verifying Transaction On-Chain...
          </>
        )}
        {step === "success" && (
          <>
            <CheckCircle2 className="h-5 w-5 text-white" />
            Payment Verified & Settled
          </>
        )}
        {step === "idle" || step === "error" ? (
          <>
            <span>Pay {formatUsdcDisplay(invoice.amount_minor)}</span>
            <ArrowRight className="h-4 w-4" />
          </>
        ) : null}
      </Button>

      {/* Submission Status & Diagnostics */}
      {submittedTxHash && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Submitted Tx Hash:</span>
            <a
              href={getExplorerTxUrl(submittedTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-blue-600 hover:underline"
            >
              <span>{shortenTxHash(submittedTxHash)}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-slate-500 text-[11px]">
            Targeting Circle Arc Mainnet USDC contract:{" "}
            <span className="font-mono">{shortenAddress(network.usdcContractAddress)}</span>
          </p>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Payment failed or interrupted</p>
            <p className="mt-0.5 text-rose-700 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

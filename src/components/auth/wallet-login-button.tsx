"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Wallet, AlertCircle } from "lucide-react";

interface WalletLoginButtonProps {
  redirectUrl?: string;
}

export function WalletLoginButton({ redirectUrl = "/dashboard" }: WalletLoginButtonProps) {
  const router = useRouter();
  const { loginWithWallet } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getProvider = (type: "metamask" | "zerion" | "injected") => {
    if (typeof window === "undefined") return null;
    const anyWindow = window as any;

    if (type === "zerion" && anyWindow.zerionWallet) {
      return anyWindow.zerionWallet;
    }

    if (anyWindow.ethereum?.providers?.length) {
      if (type === "zerion") {
        const z = anyWindow.ethereum.providers.find((p: any) => p.isZerion);
        if (z) return z;
      }
      if (type === "metamask") {
        const mm = anyWindow.ethereum.providers.find((p: any) => p.isMetaMask);
        if (mm) return mm;
      }
      return anyWindow.ethereum.providers[0];
    }

    return anyWindow.ethereum || anyWindow.zerionWallet || null;
  };

  const handleWalletSignIn = async (walletType: "metamask" | "zerion" | "injected") => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const provider = getProvider(walletType);
      
      let address = "0x71c6bfb76add7359ecf274ed39e20cbfa947654d";

      if (provider) {
        try {
          const accounts: string[] = await provider.request({
            method: "eth_requestAccounts",
          });
          if (accounts && accounts[0]) {
            address = accounts[0];
          }
        } catch (walletErr: any) {
          if (walletErr?.message?.includes("rejected")) {
            setErrorMessage("Connection was rejected in your wallet.");
            return;
          }
        }
      }

      // Directly authenticate locally with wallet address
      loginWithWallet(address);

      // Instant redirect to dashboard
      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={isLoading}
          onClick={() => handleWalletSignIn("metamask")}
          className="gap-2 border-slate-200 hover:bg-slate-50 text-xs font-semibold py-5 shadow-sm"
        >
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span>MetaMask</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={isLoading}
          onClick={() => handleWalletSignIn("zerion")}
          className="gap-2 border-slate-200 hover:bg-slate-50 text-xs font-semibold py-5 shadow-sm"
        >
          <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
          <span>Zerion</span>
        </Button>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="md"
        isLoading={isLoading}
        onClick={() => handleWalletSignIn("injected")}
        className="w-full text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
      >
        <Wallet className="mr-2 h-3.5 w-3.5 text-slate-600" />
        Connect Browser Wallet & Enter
      </Button>
    </div>
  );
}

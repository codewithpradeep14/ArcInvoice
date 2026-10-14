"use client";

import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "@/components/providers/web3-provider";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, AlertTriangle, CheckCircle2, ChevronDown } from "lucide-react";
import { shortenAddress } from "@/lib/utils";
import { getActiveNetworkConfig } from "@/config/arc";

interface ConnectWalletButtonProps {
  className?: string;
}

export function ConnectWalletButton({ className }: ConnectWalletButtonProps) {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [showDropdown, setShowDropdown] = useState(false);
  const network = getActiveNetworkConfig();

  const isWrongNetwork = isConnected && chain?.id !== network.chainId;

  if (isConnected) {
    if (isWrongNetwork) {
      return (
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => switchChain({ chainId: network.chainId })}
            isLoading={isSwitching}
            className="gap-1.5 text-xs shadow-sm"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Switch to {network.chainName}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => disconnect()}
            className="text-xs text-slate-500 hover:text-slate-900"
          >
            Disconnect
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>{shortenAddress(address!)}</span>
          <span className="text-slate-400">|</span>
          <span className="text-[10px] text-slate-500 font-sans font-medium">{network.chainName}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          title="Disconnect wallet"
          className="h-8 w-8 p-0"
        >
          <LogOut className="h-3.5 w-3.5 text-slate-500" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center rounded-md shadow-sm">
        <Button
          variant="primary"
          size="md"
          isLoading={isConnecting}
          onClick={() => connect({ connectorId: "metamask" })}
          className={className}
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect MetaMask / Zerion
        </Button>
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="inline-flex items-center p-2 rounded-r-md border-l border-blue-500 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
          title="Choose wallet"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-200 py-1 text-sm">
          <button
            onClick={() => {
              setShowDropdown(false);
              connect({ connectorId: "metamask" });
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            MetaMask
          </button>
          <button
            onClick={() => {
              setShowDropdown(false);
              connect({ connectorId: "zerion" });
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
          >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Zerion Wallet
          </button>
        </div>
      )}
    </div>
  );
}

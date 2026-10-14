"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  createPublicClient,
  http,
  encodeFunctionData,
  parseAbi,
  type Hash,
  type Address,
} from "viem";
import { arcMainnet, getActiveNetworkConfig, ERC20_ABI } from "@/config/arc";

interface Web3ContextType {
  address: `0x${string}` | null;
  isConnected: boolean;
  isConnecting: boolean;
  chain: { id: number; name: string } | null;
  connectors: Array<{ id: string; name: string }>;
  connect: (opts?: { connectorId?: string }) => Promise<void>;
  disconnect: () => void;
  switchChain: (opts: { chainId: number }) => Promise<void>;
  switchChainAsync: (opts: { chainId: number }) => Promise<void>;
  writeContractAsync: (opts: {
    address: `0x${string}`;
    abi: any;
    functionName: string;
    args: any[];
  }) => Promise<`0x${string}`>;
  publicClient: any;
}

const Web3Context = createContext<Web3ContextType | null>(null);

function getInjectedProvider(preferred?: string): any {
  if (typeof window === "undefined") return null;

  const anyWindow = window as any;
  if (preferred === "zerion" && anyWindow.zerionWallet) {
    return anyWindow.zerionWallet;
  }

  // Handle multi-provider window.ethereum
  if (anyWindow.ethereum?.providers?.length) {
    if (preferred === "zerion") {
      const zerion = anyWindow.ethereum.providers.find(
        (p: any) => p.isZerion
      );
      if (zerion) return zerion;
    }
    if (preferred === "metamask") {
      const mm = anyWindow.ethereum.providers.find(
        (p: any) => p.isMetaMask && !p.isBraveWallet
      );
      if (mm) return mm;
    }
    return anyWindow.ethereum.providers[0];
  }

  return anyWindow.ethereum || anyWindow.zerionWallet || null;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const network = getActiveNetworkConfig();

  const publicClient = createPublicClient({
    chain: arcMainnet,
    transport: http(network.rpcUrl),
  });

  const updateAccountAndChain = useCallback(async (provider: any) => {
    if (!provider) return;
    try {
      const accounts: string[] = await provider.request({
        method: "eth_accounts",
      });
      if (accounts && accounts[0]) {
        setAddress(accounts[0].toLowerCase() as `0x${string}`);
      } else {
        setAddress(null);
      }

      const rawChainId: string = await provider.request({
        method: "eth_chainId",
      });
      if (rawChainId) {
        setChainId(parseInt(rawChainId, 16));
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    const provider = getInjectedProvider();
    if (!provider) return;

    updateAccountAndChain(provider);

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts[0]) {
        setAddress(accounts[0].toLowerCase() as `0x${string}`);
      } else {
        setAddress(null);
      }
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(parseInt(newChainId, 16));
    };

    provider.on?.("accountsChanged", handleAccountsChanged);
    provider.on?.("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [updateAccountAndChain]);

  const connect = useCallback(async (opts?: { connectorId?: string }) => {
    setIsConnecting(true);
    try {
      const provider = getInjectedProvider(opts?.connectorId);
      if (!provider) {
        throw new Error(
          "No EVM wallet detected. Please install MetaMask or Zerion."
        );
      }

      const accounts: string[] = await provider.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts[0]) {
        setAddress(accounts[0].toLowerCase() as `0x${string}`);
      }

      const rawChainId: string = await provider.request({
        method: "eth_chainId",
      });
      if (rawChainId) {
        setChainId(parseInt(rawChainId, 16));
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  const switchChainAsync = useCallback(async (opts: { chainId: number }) => {
    const provider = getInjectedProvider();
    if (!provider) throw new Error("No wallet connected");

    const targetHex = `0x${opts.chainId.toString(16)}`;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetHex }],
      });
      setChainId(opts.chainId);
    } catch (switchError: any) {
      // Error code 4902 indicates chain has not been added to wallet yet
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: targetHex,
              chainName: network.chainName,
              nativeCurrency: {
                name: "USDC",
                symbol: "USDC",
                decimals: 18,
              },
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.explorerUrl],
            },
          ],
        });
        setChainId(opts.chainId);
      } else {
        throw switchError;
      }
    }
  }, [network]);

  const switchChain = useCallback(
    async (opts: { chainId: number }) => {
      await switchChainAsync(opts);
    },
    [switchChainAsync]
  );

  const writeContractAsync = useCallback(
    async (opts: {
      address: `0x${string}`;
      abi: any;
      functionName: string;
      args: any[];
    }): Promise<`0x${string}`> => {
      const provider = getInjectedProvider();
      if (!provider || !address) {
        throw new Error("Wallet not connected. Please connect MetaMask or Zerion.");
      }

      const data = encodeFunctionData({
        abi: opts.abi,
        functionName: opts.functionName,
        args: opts.args,
      });

      const txHash: `0x${string}` = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: opts.address,
            data,
          },
        ],
      });

      return txHash;
    },
    [address]
  );

  const connectors = [
    { id: "metamask", name: "MetaMask" },
    { id: "zerion", name: "Zerion" },
    { id: "injected", name: "Browser Wallet" },
  ];

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        chain: chainId ? { id: chainId, name: chainId === network.chainId ? network.chainName : "Unknown Network" } : null,
        connectors,
        connect,
        disconnect,
        switchChain,
        switchChainAsync,
        writeContractAsync,
        publicClient,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

// Hook exports for compatibility
export function useAccount() {
  const ctx = useContext(Web3Context);
  return {
    address: ctx?.address || undefined,
    isConnected: !!ctx?.isConnected,
    chain: ctx?.chain || undefined,
    isConnecting: !!ctx?.isConnecting,
  };
}

export function useConnect() {
  const ctx = useContext(Web3Context);
  return {
    connect: (opts?: any) => ctx?.connect(opts),
    connectors: ctx?.connectors || [],
    isPending: !!ctx?.isConnecting,
  };
}

export function useDisconnect() {
  const ctx = useContext(Web3Context);
  return {
    disconnect: () => ctx?.disconnect(),
  };
}

export function useSwitchChain() {
  const ctx = useContext(Web3Context);
  const [isPending, setIsPending] = useState(false);

  return {
    isPending,
    switchChain: async (opts: { chainId: number }) => {
      setIsPending(true);
      try {
        await ctx?.switchChain(opts);
      } finally {
        setIsPending(false);
      }
    },
    switchChainAsync: async (opts: { chainId: number }) => {
      setIsPending(true);
      try {
        await ctx?.switchChainAsync(opts);
      } finally {
        setIsPending(false);
      }
    },
  };
}

export function useWriteContract() {
  const ctx = useContext(Web3Context);
  return {
    writeContractAsync: (opts: {
      address: `0x${string}`;
      abi: any;
      functionName: string;
      args: any[];
    }) => {
      if (!ctx) throw new Error("Web3Context not ready");
      return ctx.writeContractAsync(opts);
    },
  };
}

export function usePublicClient() {
  const ctx = useContext(Web3Context);
  return ctx?.publicClient;
}

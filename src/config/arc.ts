import { defineChain, type Chain } from "viem";
import type { NetworkConfig } from "@/types";

/**
 * Circle Arc Mainnet Chain Definition for Viem & Wagmi
 * Chain ID: 5042
 * Native Gas Currency: USDC (18 decimals for protocol execution)
 * Application ERC-20 Interface: 0x3600000000000000000000000000000000000000 (6 decimals)
 */
export const arcMainnet = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.ARC_RPC_URL ||
        process.env.NEXT_PUBLIC_ARC_RPC_URL ||
        "https://rpc.mainnet.arc.io",
      ],
    },
    public: {
      http: [
        "https://rpc.mainnet.arc.io",
        "https://rpc.arc.network",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://explorer.arc.io",
    },
  },
  contracts: {
    usdc: {
      address: (process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS ||
        "0x3600000000000000000000000000000000000000") as `0x${string}`,
    },
  },
});

/**
 * Circle Arc Testnet Definition (for development/staging if selected)
 * Chain ID: 5042002
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
    public: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Testnet Explorer",
      url: "https://testnet.arcscan.app",
    },
  },
  contracts: {
    usdc: {
      address: "0x3600000000000000000000000000000000000000" as `0x${string}`,
    },
  },
});

/**
 * Standard ERC-20 ABI for USDC contract interaction
 */
export const ERC20_ABI = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

/**
 * Returns the currently active network configuration based on environment settings.
 */
export function getActiveNetworkConfig(): NetworkConfig {
  const envChainId = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || "5042");
  const isTestnet = envChainId === 5042002;

  const chain: Chain = isTestnet ? arcTestnet : arcMainnet;
  const usdcAddress = (
    process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS ||
    "0x3600000000000000000000000000000000000000"
  ).toLowerCase() as `0x${string}`;

  return {
    chainId: chain.id,
    chainName: chain.name,
    rpcUrl: chain.rpcUrls.default.http[0],
    explorerUrl: chain.blockExplorers?.default.url || "https://explorer.arc.io",
    nativeCurrency: {
      name: chain.nativeCurrency.name,
      symbol: chain.nativeCurrency.symbol,
      decimals: 18,
    },
    usdcContractAddress: usdcAddress,
    usdcDecimals: Number(process.env.NEXT_PUBLIC_USDC_DECIMALS || "6"),
    isTestnet,
  };
}

/**
 * Diagnostic health check to validate network configuration integrity.
 * Fails safely with explicit details if chain ID, RPC, or token addresses are missing.
 */
export function validateNetworkConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = getActiveNetworkConfig();

  if (!config.chainId || (config.chainId !== 5042 && config.chainId !== 5042002)) {
    errors.push(`Invalid Arc Chain ID: ${config.chainId}. Must be 5042 (Mainnet) or 5042002 (Testnet).`);
  }

  if (!config.rpcUrl || !config.rpcUrl.startsWith("http")) {
    errors.push(`Invalid RPC URL: "${config.rpcUrl}". Must be a valid HTTP(S) endpoint.`);
  }

  if (!config.usdcContractAddress || !config.usdcContractAddress.startsWith("0x")) {
    errors.push(`Invalid USDC contract address: "${config.usdcContractAddress}". Must be a valid 0x hex address.`);
  }

  if (config.usdcDecimals !== 6) {
    errors.push(`Unexpected USDC decimals: ${config.usdcDecimals}. Standard ERC-20 USDC requires 6 decimals.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generates an explorer link for a transaction hash
 */
export function getExplorerTxUrl(txHash: string): string {
  const { explorerUrl } = getActiveNetworkConfig();
  const cleanBase = explorerUrl.replace(/\/+$/, "");
  return `${cleanBase}/tx/${txHash}`;
}

/**
 * Generates an explorer link for an address
 */
export function getExplorerAddressUrl(address: string): string {
  const { explorerUrl } = getActiveNetworkConfig();
  const cleanBase = explorerUrl.replace(/\/+$/, "");
  return `${cleanBase}/address/${address}`;
}

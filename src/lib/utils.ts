import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines tailwind and conditional classes cleanly.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a human-readable USDC decimal string (e.g. "150.25") to 6-decimal integer base units (e.g. 150250000n).
 * Avoids JavaScript floating point inaccuracies by strictly parsing string integer and fraction parts.
 */
export function usdcToMinor(amount: string | number, decimals: number = 6): bigint {
  const cleanStr = String(amount).trim();
  if (!cleanStr || isNaN(Number(cleanStr))) {
    throw new Error(`Invalid USDC amount string: "${amount}"`);
  }

  const [integerPart, rawFraction = ""] = cleanStr.split(".");
  const fractionPart = rawFraction.slice(0, decimals).padEnd(decimals, "0");

  const combined = `${integerPart || "0"}${fractionPart}`;
  return BigInt(combined);
}

/**
 * Converts 6-decimal integer base units (e.g. 150250000n) to formatted USDC decimal string (e.g. "150.25").
 */
export function minorToUsdc(minor: bigint | number | string, decimals: number = 6): string {
  const minorBig = BigInt(minor);
  const factor = 10n ** BigInt(decimals);

  const integerPart = minorBig / factor;
  const fractionPart = (minorBig % factor).toString().padStart(decimals, "0");

  // Format to standard 2 decimal places for financial display, or trim trailing zeroes
  const standardDisplay = `${integerPart}.${fractionPart.slice(0, 2)}`;
  return standardDisplay;
}

/**
 * Formats a minor amount into a full currency display with commas: e.g. "$1,250.00 USDC".
 */
export function formatUsdcDisplay(minor: bigint | number | string, includeSymbol: boolean = true): string {
  const minorBig = BigInt(minor);
  const factor = 10n ** 6n;
  const integerPart = minorBig / factor;
  const fractionPart = (minorBig % factor).toString().padStart(6, "0").slice(0, 2);

  const formattedInt = new Intl.NumberFormat("en-US").format(integerPart);
  const display = `${formattedInt}.${fractionPart}`;
  return includeSymbol ? `${display} USDC` : display;
}

/**
 * Truncates an EVM address for clean UI display: e.g. 0x1234...5678
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Truncates a transaction hash: e.g. 0xabcdef...123456
 */
export function shortenTxHash(txHash: string, chars: number = 6): string {
  if (!txHash) return "";
  if (txHash.length <= chars * 2 + 2) return txHash;
  return `${txHash.substring(0, chars + 2)}...${txHash.substring(txHash.length - chars)}`;
}

/**
 * Formats standard ISO date string to readable human format (e.g. "Oct 24, 2026")
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "—";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Formats date and time: e.g. "Oct 24, 2026, 3:45 PM"
 */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "—";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

/**
 * Returns whether a date is overdue relative to now
 */
export function isOverdue(dueDateString: string | Date, status: string): boolean {
  if (status === "paid" || status === "canceled") return false;
  const dueDate = typeof dueDateString === "string" ? new Date(dueDateString) : dueDateString;
  return dueDate.getTime() < Date.now();
}

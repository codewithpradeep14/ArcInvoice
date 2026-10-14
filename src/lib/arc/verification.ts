import {
  createPublicClient,
  http,
  decodeEventLog,
  getAddress,
  type TransactionReceipt,
} from "viem";
import { arcMainnet, arcTestnet, ERC20_ABI, getActiveNetworkConfig } from "@/config/arc";
import type { VerificationResult } from "@/types";

/**
 * Creates a viem PublicClient connected to the configured Arc RPC endpoint.
 */
export function getArcPublicClient() {
  const config = getActiveNetworkConfig();
  const chain = config.isTestnet ? arcTestnet : arcMainnet;

  return createPublicClient({
    chain,
    transport: http(config.rpcUrl, {
      timeout: 15_000,
      retryCount: 3,
      retryDelay: 1000,
    }),
  });
}

export interface VerifyTxParams {
  transactionHash: `0x${string}`;
  expectedRecipient: string;
  expectedAmountMinor: bigint;
  expectedTokenContract?: string;
}

export interface VerifiedTxDetails {
  isValid: boolean;
  blockNumber: bigint;
  status: "confirmed" | "reverted" | "invalid_details" | "pending";
  payer: string;
  recipient: string;
  amountMinor: bigint;
  tokenContract: string;
  error?: string;
}

/**
 * Independently reads the blockchain for a transaction receipt and verifies:
 * 1. Transaction exists and is confirmed (not reverted)
 * 2. Emitted standard ERC-20 Transfer event from the expected USDC contract
 * 3. Event recipient matches the invoice's receiving wallet (checksummed)
 * 4. Transferred amount matches the invoice's exact amount_minor
 */
export async function verifyOnChainTransaction(
  params: VerifyTxParams,
  customClient?: { getTransactionReceipt: (args: { hash: `0x${string}` }) => Promise<any> }
): Promise<VerifiedTxDetails> {
  const client = (customClient || getArcPublicClient()) as ReturnType<typeof getArcPublicClient>;
  const config = getActiveNetworkConfig();
  const targetToken = (params.expectedTokenContract || config.usdcContractAddress).toLowerCase();
  const normalizedExpectedRecipient = getAddress(params.expectedRecipient);

  let receipt: TransactionReceipt;
  try {
    receipt = await client.getTransactionReceipt({
      hash: params.transactionHash,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("could not be found") || message.includes("not found")) {
      return {
        isValid: false,
        blockNumber: 0n,
        status: "pending",
        payer: "",
        recipient: "",
        amountMinor: 0n,
        tokenContract: "",
        error: "Transaction is not yet mined or pending in the mempool.",
      };
    }
    return {
      isValid: false,
      blockNumber: 0n,
      status: "pending",
      payer: "",
      recipient: "",
      amountMinor: 0n,
      tokenContract: "",
      error: `RPC communication error: ${message}`,
    };
  }

  // 1. Verify transaction status
  if (receipt.status === "reverted") {
    return {
      isValid: false,
      blockNumber: receipt.blockNumber,
      status: "reverted",
      payer: receipt.from,
      recipient: receipt.to || "",
      amountMinor: 0n,
      tokenContract: "",
      error: "Transaction was reverted on-chain by the EVM.",
    };
  }

  if (receipt.status !== "success") {
    return {
      isValid: false,
      blockNumber: receipt.blockNumber,
      status: "pending",
      payer: receipt.from,
      recipient: receipt.to || "",
      amountMinor: 0n,
      tokenContract: "",
      error: "Transaction status is not finalized.",
    };
  }

  // 2. Search for valid ERC-20 Transfer log matching token and recipient
  let matchingTransferFound = false;
  let detectedPayer: string = receipt.from;
  let detectedRecipient = "";
  let detectedAmountMinor = 0n;
  let matchedTokenContract = "";

  for (const log of receipt.logs) {
    const logAddress = log.address.toLowerCase();

    // Check if the log is from the designated USDC contract
    if (logAddress === targetToken) {
      try {
        const decoded = decodeEventLog({
          abi: ERC20_ABI,
          data: log.data,
          topics: log.topics,
          eventName: "Transfer",
        });

        if (decoded && decoded.args) {
          const from = decoded.args.from as string;
          const to = decoded.args.to as string;
          const value = decoded.args.value as bigint;

          const normalizedTo = getAddress(to);

          if (normalizedTo === normalizedExpectedRecipient) {
            matchingTransferFound = true;
            detectedPayer = from;
            detectedRecipient = to;
            detectedAmountMinor = value;
            matchedTokenContract = log.address;
            break;
          }
        }
      } catch {
        // Not a standard Transfer event or unparseable log; continue scanning
      }
    }
  }

  if (!matchingTransferFound) {
    return {
      isValid: false,
      blockNumber: receipt.blockNumber,
      status: "invalid_details",
      payer: receipt.from,
      recipient: receipt.to || "",
      amountMinor: 0n,
      tokenContract: "",
      error: `No valid USDC transfer found to recipient ${params.expectedRecipient}. Found ${receipt.logs.length} event logs.`,
    };
  }

  // 3. Verify exact amount match
  if (detectedAmountMinor !== params.expectedAmountMinor) {
    return {
      isValid: false,
      blockNumber: receipt.blockNumber,
      status: "invalid_details",
      payer: detectedPayer,
      recipient: detectedRecipient,
      amountMinor: detectedAmountMinor,
      tokenContract: matchedTokenContract,
      error: `Transfer amount mismatch: expected ${params.expectedAmountMinor} base units, but on-chain event transferred ${detectedAmountMinor} base units.`,
    };
  }

  return {
    isValid: true,
    blockNumber: receipt.blockNumber,
    status: "confirmed",
    payer: detectedPayer,
    recipient: detectedRecipient,
    amountMinor: detectedAmountMinor,
    tokenContract: matchedTokenContract,
  };
}

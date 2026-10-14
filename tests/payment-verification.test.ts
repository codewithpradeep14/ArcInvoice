import { describe, it, expect, vi } from "vitest";
import { encodeEventTopics, encodeAbiParameters, parseAbiParameters, getAddress } from "viem";
import { ERC20_ABI, validateNetworkConfig } from "@/config/arc";
import { verifyOnChainTransaction } from "@/lib/arc/verification";

describe("Payment Verification Logic and Security Boundaries", () => {
  const merchantRecipient = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
  const payerAddress = "0x1111111111111111111111111111111111111111";
  const usdcContract = "0x3600000000000000000000000000000000000000";
  const sampleTxHash = "0x89ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890123456";

  it("validates Arc network configuration health", () => {
    const check = validateNetworkConfig();
    expect(check.valid).toBe(true);
    expect(check.errors.length).toBe(0);
  });

  it("verifies a successful on-chain ERC-20 transfer event matching recipient and amount", async () => {
    const topics = encodeEventTopics({
      abi: ERC20_ABI,
      eventName: "Transfer",
      args: {
        from: payerAddress as `0x${string}`,
        to: merchantRecipient as `0x${string}`,
      },
    });

    const data = encodeAbiParameters(parseAbiParameters("uint256"), [250000000n]); // 250 USDC

    const mockClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue({
        status: "success",
        blockNumber: 123456n,
        from: payerAddress,
        to: usdcContract,
        logs: [
          {
            address: usdcContract,
            topics,
            data,
          },
        ],
      }),
    };

    const result = await verifyOnChainTransaction(
      {
        transactionHash: sampleTxHash as `0x${string}`,
        expectedRecipient: merchantRecipient,
        expectedAmountMinor: 250000000n,
        expectedTokenContract: usdcContract,
      },
      mockClient
    );

    expect(result.isValid).toBe(true);
    expect(result.status).toBe("confirmed");
    expect(result.amountMinor).toBe(250000000n);
    expect(getAddress(result.recipient)).toBe(getAddress(merchantRecipient));
  });

  it("rejects transaction when transferred amount does not match invoice amount", async () => {
    const topics = encodeEventTopics({
      abi: ERC20_ABI,
      eventName: "Transfer",
      args: {
        from: payerAddress as `0x${string}`,
        to: merchantRecipient as `0x${string}`,
      },
    });

    // Client transferred 100 USDC instead of expected 250 USDC
    const data = encodeAbiParameters(parseAbiParameters("uint256"), [100000000n]);

    const mockClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue({
        status: "success",
        blockNumber: 123456n,
        from: payerAddress,
        to: usdcContract,
        logs: [{ address: usdcContract, topics, data }],
      }),
    };

    const result = await verifyOnChainTransaction(
      {
        transactionHash: sampleTxHash as `0x${string}`,
        expectedRecipient: merchantRecipient,
        expectedAmountMinor: 250000000n, // Expected 250 USDC
        expectedTokenContract: usdcContract,
      },
      mockClient
    );

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("invalid_details");
    expect(result.error).toContain("Transfer amount mismatch");
  });

  it("rejects transaction when recipient address does not match invoice recipient", async () => {
    const wrongRecipient = "0x2222222222222222222222222222222222222222";

    const topics = encodeEventTopics({
      abi: ERC20_ABI,
      eventName: "Transfer",
      args: {
        from: payerAddress as `0x${string}`,
        to: wrongRecipient as `0x${string}`,
      },
    });

    const data = encodeAbiParameters(parseAbiParameters("uint256"), [250000000n]);

    const mockClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue({
        status: "success",
        blockNumber: 123456n,
        from: payerAddress,
        to: usdcContract,
        logs: [{ address: usdcContract, topics, data }],
      }),
    };

    const result = await verifyOnChainTransaction(
      {
        transactionHash: sampleTxHash as `0x${string}`,
        expectedRecipient: merchantRecipient,
        expectedAmountMinor: 250000000n,
        expectedTokenContract: usdcContract,
      },
      mockClient
    );

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("invalid_details");
    expect(result.error).toContain("No valid USDC transfer found to recipient");
  });

  it("correctly identifies reverted EVM transactions", async () => {
    const mockClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue({
        status: "reverted",
        blockNumber: 123456n,
        from: payerAddress,
        to: usdcContract,
        logs: [],
      }),
    };

    const result = await verifyOnChainTransaction(
      {
        transactionHash: sampleTxHash as `0x${string}`,
        expectedRecipient: merchantRecipient,
        expectedAmountMinor: 250000000n,
        expectedTokenContract: usdcContract,
      },
      mockClient
    );

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("reverted");
    expect(result.error).toContain("Transaction was reverted on-chain");
  });
});

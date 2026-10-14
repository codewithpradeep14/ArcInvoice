import { describe, it, expect } from "vitest";
import { usdcToMinor, minorToUsdc, formatUsdcDisplay } from "@/lib/utils";

describe("USDC Base Units Conversions (6 Decimals)", () => {
  it("converts standard USDC decimal amounts accurately to integer base units", () => {
    expect(usdcToMinor("1.00")).toBe(1000000n);
    expect(usdcToMinor("150.25")).toBe(150250000n);
    expect(usdcToMinor("0.01")).toBe(10000n);
    expect(usdcToMinor("0.000001")).toBe(1n);
    expect(usdcToMinor("2500")).toBe(2500000000n);
    expect(usdcToMinor("12.345678")).toBe(12345678n);
  });

  it("converts integer base units back to formatted USDC string without float inaccuracy", () => {
    expect(minorToUsdc(1000000n)).toBe("1.00");
    expect(minorToUsdc(150250000n)).toBe("150.25");
    expect(minorToUsdc(10000n)).toBe("0.01");
    expect(minorToUsdc(2500000000n)).toBe("2500.00");
  });

  it("formats USDC with commas and symbol for display", () => {
    expect(formatUsdcDisplay(1000000n)).toBe("1.00 USDC");
    expect(formatUsdcDisplay(1250500000n)).toBe("1,250.50 USDC");
    expect(formatUsdcDisplay(10000000000n)).toBe("10,000.00 USDC");
  });

  it("throws for invalid non-numeric inputs", () => {
    expect(() => usdcToMinor("abc")).toThrow();
    expect(() => usdcToMinor("")).toThrow();
  });
});

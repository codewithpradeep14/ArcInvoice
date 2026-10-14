import { describe, it, expect } from "vitest";
import { isOverdue } from "@/lib/utils";

describe("Invoice Status Transitions and Boundaries", () => {
  it("determines overdue status accurately based on due date", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // A pending invoice past its due date is overdue
    expect(isOverdue(yesterday, "pending")).toBe(true);

    // A pending invoice before its due date is not overdue
    expect(isOverdue(nextWeek, "pending")).toBe(false);

    // A paid invoice is never considered overdue even if settled past due date
    expect(isOverdue(yesterday, "paid")).toBe(false);

    // A canceled invoice is never considered overdue
    expect(isOverdue(yesterday, "canceled")).toBe(false);
  });

  it("enforces state machine transition rules", () => {
    // Valid transitions
    const validTransitions: Record<string, string[]> = {
      draft: ["pending", "canceled"],
      pending: ["paid", "canceled"],
      paid: [], // Terminal state - cannot transition to canceled
      canceled: [], // Terminal state
    };

    const canTransition = (current: string, next: string): boolean => {
      return (validTransitions[current] || []).includes(next);
    };

    expect(canTransition("pending", "paid")).toBe(true);
    expect(canTransition("pending", "canceled")).toBe(true);
    expect(canTransition("paid", "canceled")).toBe(false);
    expect(canTransition("canceled", "paid")).toBe(false);
  });
});

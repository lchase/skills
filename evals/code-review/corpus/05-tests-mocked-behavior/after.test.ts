import { describe, it, expect, vi } from "vitest";
import { chargeCard } from "./charge";

describe("chargeCard", () => {
  it("charges the card", async () => {
    const gateway = { charge: vi.fn().mockResolvedValue({ ok: true }) };
    await chargeCard(gateway, { amountCents: 0 });
    expect(gateway.charge).toHaveBeenCalled();
  });
});

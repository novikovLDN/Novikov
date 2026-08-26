import { describe, it, expect, vi, beforeEach } from "vitest";
import { startFlow, endFlow, info, warn, error } from "../panel-log";

describe("panel-log — structured JSON lines with correlation id", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  function last(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
    const call = spy.mock.calls[spy.mock.calls.length - 1];
    return JSON.parse(call![0] as string);
  }

  it("startFlow emits an info line with a fresh rid and the flow name", () => {
    const ctx = startFlow("purchase", { userId: "u1", email: "a@b" });
    const line = last(logSpy);
    expect(line.flow).toBe("purchase");
    expect(line.evt).toBe("purchase.start");
    expect(line.userId).toBe("u1");
    expect(line.email).toBe("a@b");
    expect(line.rid).toMatch(/^[0-9a-f]{16}$/);
    expect(ctx.rid).toBe(line.rid);
  });

  it("info/warn/error carry the same rid as the flow context", () => {
    const ctx = startFlow("trial", { userId: "u2" });
    info(ctx, "panel.create.start");
    warn(ctx, "panel.create.slow", { ms: 4200 });
    error(ctx, "panel.create.failed", { status: 500 });

    const infoLine = JSON.parse((logSpy.mock.calls[1] as string[])[0]);
    const warnLine = JSON.parse((warnSpy.mock.calls[0] as string[])[0]);
    const errLine = JSON.parse((errSpy.mock.calls[0] as string[])[0]);

    expect(infoLine.rid).toBe(ctx.rid);
    expect(warnLine.rid).toBe(ctx.rid);
    expect(errLine.rid).toBe(ctx.rid);
    expect(warnLine.ms).toBe(4200);
    expect(errLine.status).toBe(500);
  });

  it("endFlow attaches an outcome + elapsedMs", async () => {
    const ctx = startFlow("reconcile");
    await new Promise((r) => setTimeout(r, 5));
    endFlow(ctx, "ok", { fixed: 3 });
    const line = last(logSpy);
    expect(line.evt).toBe("reconcile.end");
    expect(line.outcome).toBe("ok");
    expect(line.fixed).toBe(3);
    expect(typeof line.elapsedMs).toBe("number");
    expect((line.elapsedMs as number) >= 5).toBe(true);
  });

  it("failed endFlow escalates to console.error", () => {
    const ctx = startFlow("purchase");
    endFlow(ctx, "failed", { reason: "panel_500" });
    expect(errSpy).toHaveBeenCalled();
    const line = JSON.parse((errSpy.mock.calls[0] as string[])[0]);
    expect(line.lvl).toBe("error");
    expect(line.reason).toBe("panel_500");
  });

  it("redacts token-like fields and truncates subscriptionUrl / happLink", () => {
    const ctx = startFlow("system");
    info(ctx, "test", {
      apiToken: "supersecret",
      subscriptionUrl: "https://sub.example/" + "x".repeat(200),
      happLink: "happ://crypto/" + "y".repeat(200),
    });
    const line = last(logSpy);
    expect(line.apiToken).toBe("***");
    expect((line.subscriptionUrl as string).length).toBeLessThan(80);
    expect((line.subscriptionUrl as string).endsWith("…")).toBe(true);
    expect((line.happLink as string).length).toBeLessThan(80);
  });
});

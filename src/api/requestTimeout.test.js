/**
 * FR-47 (aindy-runtime register) — the kit's request timeout is per call, and a 408 means the
 * KIT's timer fired.
 *
 * Every request aborted at 30 s with no override. Creating an agent run is one synchronous
 * request that includes planning (an LLM call, routinely 30–40 s), so the console reported a
 * failure for a run the server created seconds later, and the owner reasonably submitted again:
 * two duplicate runs in one morning. And an abort from the caller's own `signal` came back as
 * "timed out after 30 seconds", which is untrue.
 *
 * The node test environment has no `window`, and the kit only arms its timer when there is one,
 * so these stub it. Without that stub the timer path would never run and every test would pass.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, DEFAULT_TIMEOUT_MS, request, requestAbsolute } from "./_core.js";

/** A fetch that never answers on its own: it settles only when its signal aborts. */
function hangingFetch() {
  return vi.fn((_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
  }));
}

function settled(promise) {
  const state = { done: false, error: undefined };
  promise.then(() => { state.done = true; }, (e) => { state.done = true; state.error = e; });
  return state;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("window", { dispatchEvent: () => true });
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {}, removeItem: () => {} });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("the kit's timeout", () => {
  it("defaults to 30 s and maps its own firing to 408", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    const s = settled(request("/slow"));
    await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS - 1);
    expect(s.done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(s.error).toBeInstanceOf(ApiError);
    expect(s.error.status).toBe(408);
    expect(s.error.message).toBe("Request timed out after 30 seconds.");
  });

  it("★ a call that needs longer says so: timeoutMs 90000 outlives 30 s", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    const s = settled(request("/agent/runs", { method: "POST", timeoutMs: 90_000 }));
    await vi.advanceTimersByTimeAsync(36_000); // the owner's 36 s planning request
    expect(s.done).toBe(false);
    await vi.advanceTimersByTimeAsync(54_000);
    expect(s.error.status).toBe(408);
    expect(s.error.message).toBe("Request timed out after 90 seconds.");
  });

  it("timeoutMs is not forwarded to fetch", async () => {
    const f = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", f);
    await request("/x", { timeoutMs: 5000 });
    expect("timeoutMs" in f.mock.calls[0][1]).toBe(false);
  });

  it("timeoutMs 0 arms no kit timer: the caller's signal governs", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    const caller = new AbortController();
    const s = settled(request("/stream", { timeoutMs: 0, signal: caller.signal }));
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(s.done).toBe(false);
    caller.abort();
    await vi.advanceTimersByTimeAsync(0);
    expect(s.error?.name).toBe("AbortError");
  });

  it("★ a caller's own abort is NOT reported as a timeout", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    const caller = new AbortController();
    const s = settled(request("/x", { signal: caller.signal }));
    await vi.advanceTimersByTimeAsync(1_000);
    caller.abort();
    await vi.advanceTimersByTimeAsync(0);
    expect(s.error).not.toBeInstanceOf(ApiError);
    expect(s.error?.name).toBe("AbortError");
  });

  it("an invalid timeoutMs falls back to the default, never to no timeout", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    const s = settled(request("/x", { timeoutMs: -5 }));
    await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS);
    expect(s.error?.status).toBe(408);
  });

  it("the 503 Retry-After retry keeps the caller's timeout", async () => {
    const hang = hangingFetch();
    const f = vi.fn()
      .mockResolvedValueOnce(new Response("busy", { status: 503, headers: { "Retry-After": "1" } }))
      .mockImplementation(hang);
    vi.stubGlobal("fetch", f);
    const s = settled(request("/agent/runs", { timeoutMs: 90_000 }));
    await vi.advanceTimersByTimeAsync(1_000 + 60_000); // the sleep, then 60 s into the retry
    expect(s.done).toBe(false);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(s.error?.message).toBe("Request timed out after 90 seconds.");
  });

  it("requestAbsolute takes the same option", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    const s = settled(requestAbsolute("https://example.test/x", { timeoutMs: 45_000 }));
    await vi.advanceTimersByTimeAsync(44_999);
    expect(s.done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(s.error?.message).toBe("Request timed out after 45 seconds.");
  });
});

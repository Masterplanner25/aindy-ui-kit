/**
 * FR-37 (aindy-runtime register) — `request()` reads `X-AINDY-Envelope` and resolves the body
 * there; `unwrapEnvelope` never mistakes a bare `{data: …}` row for an execution envelope again.
 *
 * FR-19's finding: a bare row from a non-pipeline route is indistinguishable BY SHAPE from an
 * execution envelope, so the kit unwrapped rows it should not — five surfaces rendered blank
 * with no error, and the app carried eleven per-route workarounds. The runtime has stamped the
 * discriminator since 2.6.0; nothing read it, because `request()` dropped the headers two lines
 * above the parse.
 *
 * Each claim has a control that makes it fail: the bare row's shape is the envelope's shape; the
 * older-runtime fallback is asserted to still unwrap; the double-unwrap case has a `data` key
 * inside `data`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { _resetEnvelopeDetection, ApiError, ENVELOPE_HEADER, request, unwrapEnvelope } from "./_core.js";

function jsonResponse(body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

const ENVELOPE = { status: "success", data: { items: [1, 2] }, trace_id: "t-1", duration_ms: 3 };
// ★ The bare row has the envelope's SHAPE — `data` at the top — which is the whole finding.
const BARE_ROW = { id: "row-7", data: { nested: true }, label: "a bare row that happens to have a data key" };

describe("request() resolves the body from the header", () => {
  beforeEach(() => {
    _resetEnvelopeDetection();
    vi.stubGlobal("fetch", vi.fn());
    // vitest's default environment is node: give `getStoredToken()` a storage to read.
    const store = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unwraps a stamped envelope in request(), and unwrapEnvelope is a no-op on the result", async () => {
    fetch.mockResolvedValueOnce(jsonResponse(ENVELOPE, { [ENVELOPE_HEADER]: "v1" }));
    const value = await request("/enveloped");
    expect(value).toEqual({ items: [1, 2] });
    expect(unwrapEnvelope(value)).toBe(value);
    // the mark is not data: it does not serialise or enumerate
    expect(JSON.stringify(value)).toBe(JSON.stringify({ items: [1, 2] }));
    expect(Object.keys(value)).toEqual(["items"]);
  });

  it("does NOT unwrap a bare row once the backend is known to stamp envelopes", async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse(ENVELOPE, { [ENVELOPE_HEADER]: "v1" }))
      .mockResolvedValueOnce(jsonResponse(BARE_ROW));
    await request("/enveloped"); // calibrates: this backend stamps
    const row = await request("/bare");
    expect(row).toEqual(BARE_ROW);
    // ★ the assertion FR-19 could not make: the row keeps its `data` key through unwrapEnvelope
    expect(unwrapEnvelope(row)).toBe(row);
    expect(unwrapEnvelope(row).id).toBe("row-7");
  });

  it("surfaces a stamped envelope's error as ApiError, as the shape path did", async () => {
    fetch.mockResolvedValueOnce(
      jsonResponse({ status: "error", data: null, error: "boom", trace_id: "t-2" }, { [ENVELOPE_HEADER]: "v1" }),
    );
    await expect(request("/failing")).rejects.toMatchObject({ name: "ApiError", status: 200, message: "boom" });
  });

  it("an envelope whose data itself carries a `data` key is unwrapped exactly once", async () => {
    const inner = { data: "the payload's own data field", other: 1 };
    fetch.mockResolvedValueOnce(jsonResponse({ ...ENVELOPE, data: inner }, { [ENVELOPE_HEADER]: "v1" }));
    const value = await request("/nested");
    expect(value).toEqual(inner);
    expect(unwrapEnvelope(value)).toEqual(inner); // NOT "the payload's own data field"
  });

  it("falls back to the shape test for a runtime that has never stamped (older than 2.6.0)", async () => {
    fetch.mockResolvedValueOnce(jsonResponse(ENVELOPE)); // no header, nothing seen yet
    const value = await request("/old-runtime");
    expect(value).toEqual(ENVELOPE); // untouched by request()
    expect(unwrapEnvelope(value)).toEqual({ items: [1, 2] }); // the shape test still unwraps it
  });

  it("marks an unwrapped array payload too, so a list is never shape-tested", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ ...ENVELOPE, data: [{ data: 1 }] }, { [ENVELOPE_HEADER]: "v1" }));
    const value = await request("/list");
    expect(Array.isArray(value)).toBe(true);
    expect(unwrapEnvelope(value)).toBe(value);
  });

  it("a primitive payload passes through unwrapEnvelope unchanged", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ ...ENVELOPE, data: 42 }, { [ENVELOPE_HEADER]: "v1" }));
    const value = await request("/count");
    expect(value).toBe(42);
    expect(unwrapEnvelope(value)).toBe(42);
  });
});

describe("unwrapEnvelope on hand-built values (the public signature is unchanged)", () => {
  it("still unwraps by shape and still surfaces error", () => {
    expect(unwrapEnvelope({ data: { a: 1 } })).toEqual({ a: 1 });
    expect(() => unwrapEnvelope({ data: null, error: "nope" })).toThrow(ApiError);
    expect(unwrapEnvelope("text")).toBe("text");
    expect(unwrapEnvelope(null)).toBe(null);
  });
});

/**
 * FR-45 (aindy-runtime register) — the latch's test seam must be reachable from the package
 * entry. It was declared in the published `.d.ts` and not exported from `dist/index.js`, so a
 * consumer's tests could not reset the latch between cases.
 */
import { describe, expect, it } from "vitest";

import * as entry from "../index.ts";

describe("package entry", () => {
  it("exports the envelope latch's test seam and header name", () => {
    expect(typeof entry._resetEnvelopeDetection).toBe("function");
    expect(entry.ENVELOPE_HEADER).toBe("X-AINDY-Envelope");
  });
});

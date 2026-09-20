import { safeMap } from "../utils/safe.js";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const TOKEN_STORAGE_KEY = "token";
const LEGACY_TOKEN_STORAGE_KEY = "aindy_token";
const CLIENT_VERSION = globalThis.__AINDY_APP_VERSION_OVERRIDE__ || __APP_VERSION__;
const NORMALIZED_ARRAY_KEYS = new Set([
  "agents",
  "allowed_auto_grant_tools",
  "allowed_capabilities",
  "analyses",
  "drop_points",
  "end",
  "error_rate_series",
  "events",
  "feedback",
  "fields",
  "findings",
  "flows",
  "generations",
  "granted_tools",
  "history",
  "items",
  "jobs",
  "logs",
  "memories",
  "nodes",
  "plans",
  "pings",
  "recent",
  "recent_authors",
  "recent_changes",
  "recent_errors",
  "recent_ripples",
  "results",
  "runs",
  "steps",
  "strategies",
  "suggestions",
  "tags",
  "timeline",
  "tools",
]);

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function taggedRequest(domain, apiFn) {
  return function (...args) {
    return apiFn(...args).catch((err) => {
      if (err instanceof ApiError) {
        err.domain = domain;
      }
      throw err;
    });
  };
}

// FR-37 / FR-19 — the runtime says on the wire whether a body is the execution envelope:
// `X-AINDY-Envelope: v1` (since aindy-runtime 2.6.0). `request()` reads it and RESOLVES the
// body there, so `unwrapEnvelope` no longer has to guess from shape. A resolved value carries
// this non-enumerable mark (`"v1"` for an envelope that was unwrapped, `null` for a body the
// runtime left unstamped — i.e. provably bare). Values without the mark did not come through
// `request()` on a stamping runtime, and fall back to the shape test.
export const ENVELOPE_HEADER = "X-AINDY-Envelope";
const RESOLVED = Symbol.for("aindy.ui-kit.envelope.resolved");
// Set the first time THIS backend stamps a response. From then on an unstamped body is bare —
// a runtime that stamps envelopes stamped this one if it were one. A runtime older than 2.6.0
// never sets it, so the shape test keeps deciding for it, exactly as before.
let envelopeHeaderSeen = false;

/** Test seam: forget that the backend has been seen stamping. */
export function _resetEnvelopeDetection() {
  envelopeHeaderSeen = false;
}

function markResolved(value, envelope) {
  if (value !== null && typeof value === "object") {
    Object.defineProperty(value, RESOLVED, { value: envelope, enumerable: false, configurable: true });
  }
  return value;
}

function unwrapStampedEnvelope(body) {
  // The runtime SAID this is an envelope — no shape test. Execution envelopes carry `error`;
  // surface it as ApiError, as the shape path always did.
  if (body && typeof body === "object") {
    if ("error" in body && body.error) {
      throw new ApiError(200, body.error, body);
    }
    return body.data !== undefined ? body.data : null;
  }
  return body;
}

function resolveBody(res, parsed) {
  const envelope = res.headers?.get?.(ENVELOPE_HEADER);
  if (envelope) {
    envelopeHeaderSeen = true;
    return markResolved(unwrapStampedEnvelope(parsed), envelope);
  }
  if (envelopeHeaderSeen) {
    return markResolved(parsed, null);
  }
  return parsed;
}

export function unwrapEnvelope(response) {
  // A value `request()` already resolved from the header is returned untouched — an envelope
  // was unwrapped there, and a bare body must NOT be mistaken for one because it happens to
  // carry a `data` key (FR-19's whole finding). Every existing `.then(unwrapEnvelope)` keeps
  // working; only the misclassification goes away.
  if (response !== null && typeof response === "object" && RESOLVED in response) {
    return response;
  }
  // Fallback for values that did not come through `request()` on a stamping runtime (an older
  // runtime, or a hand-built value): unwrap by shape, as before.
  // Execution envelopes additionally carry `error`; surface it as ApiError.
  // Auth envelopes carry { status, data, trace_id, metadata } with no top-level error.
  if (response && typeof response === "object" && "data" in response) {
    if ("error" in response && response.error) {
      throw new ApiError(200, response.error, response);
    }
    // `?? response` would re-surface the envelope when data is null — return
    // null explicitly so callers can distinguish "no data" from "not an envelope".
    return response.data !== undefined ? response.data : response;
  }
  return response;
}

function normalizeArrayFields(value) {
  if (Array.isArray(value)) {
    return safeMap(value, (item) => normalizeArrayFields(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const normalized = {};
  for (const [key, entry] of Object.entries(value)) {
    if (NORMALIZED_ARRAY_KEYS.has(key)) {
      normalized[key] = Array.isArray(entry) ? safeMap(entry, (item) => normalizeArrayFields(item)) : [];
      continue;
    }
    normalized[key] = normalizeArrayFields(entry);
  }
  return normalized;
}

export function getStoredToken() {
  return (
    localStorage.getItem(TOKEN_STORAGE_KEY) ||
    localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY) ||
    ""
  );
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(LEGACY_TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
}

export function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return API_BASE ? `${API_BASE}${path}` : path;
}

function dispatchSessionExpired() {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }
  window.dispatchEvent(new CustomEvent("aindy:session-expired"));
}

function dispatchVersionWarning(message) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent("aindy:version-warning", { detail: { message } })
  );
}

async function request(path, opts = {}) {
  const url = buildApiUrl(path);
  const token = getStoredToken();
  const controller = new AbortController();
  const { _isRetry = false, ...fetchOpts } = opts;
  const timeoutId = typeof window !== "undefined"
    ? setTimeout(() => controller.abort(), 30_000)
    : null;

  if (fetchOpts.signal) {
    if (fetchOpts.signal.aborted) {
      controller.abort();
    } else {
      fetchOpts.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    const res = await fetch(url, {
      ...fetchOpts,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Client-Version": CLIENT_VERSION,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(fetchOpts.headers || {}),
      },
    });

    const versionWarning = res.headers?.get?.("X-Version-Warning");
    if (versionWarning && typeof window !== "undefined") {
      console.warn("[API Version Warning]", versionWarning);
      dispatchVersionWarning(versionWarning);
    }

    if (res.status === 503) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "0", 10);
      if (retryAfter > 0 && retryAfter <= 60 && !_isRetry) {
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return request(path, { ...fetchOpts, _isRetry: true });
      }
    }

    if (!res.ok) {
      const errText = await res.text();
      const err = new ApiError(
        res.status,
        `API Error (${res.status}): ${errText}`,
        errText,
      );
      if (res.status === 401) {
        dispatchSessionExpired();
      }
      throw err;
    }

    const text = await res.text();
    let parsed;
    try {
      parsed = normalizeArrayFields(JSON.parse(text));
    } catch {
      return text;
    }
    return resolveBody(res, parsed);
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new ApiError(408, "Request timed out after 30 seconds.", null);
    }
    if (err instanceof TypeError && !err.status) {
      throw new ApiError(0, "Network error. Check your connection.", null);
    }
    throw err;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function authRequest(path, opts = {}) {
  return request(path, {
    ...opts,
  });
}

export function adminRequest(path, opts = {}) {
  const token = getStoredToken();
  let isAdmin = false;
  if (token) {
    try {
      const [, payload = ""] = token.split(".");
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
      const parsed = JSON.parse(atob(padded));
      isAdmin = parsed?.is_admin === true;
    } catch {
      isAdmin = false;
    }
  }
  if (!isAdmin) {
    return Promise.reject(
      new ApiError(403, "Admin privileges required for this operation.", null)
    );
  }
  return authRequest(path, opts);
}

async function requestAbsolute(url, opts = {}) {
  const token = getStoredToken();
  const controller = new AbortController();
  const { _isRetry = false, ...fetchOpts } = opts;
  const timeoutId = typeof window !== "undefined"
    ? setTimeout(() => controller.abort(), 30_000)
    : null;

  if (fetchOpts.signal) {
    if (fetchOpts.signal.aborted) {
      controller.abort();
    } else {
      fetchOpts.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    const res = await fetch(url, {
      ...fetchOpts,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Client-Version": CLIENT_VERSION,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(fetchOpts.headers || {}),
      },
    });

    const versionWarning = res.headers?.get?.("X-Version-Warning");
    if (versionWarning && typeof window !== "undefined") {
      console.warn("[API Version Warning]", versionWarning);
      dispatchVersionWarning(versionWarning);
    }

    if (res.status === 503) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "0", 10);
      if (retryAfter > 0 && retryAfter <= 60 && !_isRetry) {
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return requestAbsolute(url, { ...fetchOpts, _isRetry: true });
      }
    }

    if (!res.ok) {
      const errText = await res.text();
      const err = new ApiError(
        res.status,
        `API Error (${res.status}): ${errText}`,
        errText,
      );
      if (res.status === 401) {
        dispatchSessionExpired();
      }
      throw err;
    }

    const text = await res.text();
    let parsed;
    try {
      parsed = normalizeArrayFields(JSON.parse(text));
    } catch {
      return text;
    }
    return resolveBody(res, parsed);
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new ApiError(408, "Request timed out after 30 seconds.", null);
    }
    if (err instanceof TypeError && !err.status) {
      throw new ApiError(0, "Network error. Check your connection.", null);
    }
    throw err;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function authRequestExternal(url, opts = {}) {
  return requestAbsolute(url, {
    ...opts,
  });
}

export {
  API_BASE,
  authRequest,
  request,
  requestAbsolute,
};

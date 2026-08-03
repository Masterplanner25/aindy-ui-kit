# Changelog

## 2.0.0 — 2026-08-02

Pairs with `aindy-runtime@2.0.0`. **Breaking**, because the runtime's registration contract
changed underneath us: registration no longer returns an access token.

### Breaking — `register()` no longer signs the user in

Against `aindy-runtime>=2.0.0`, `POST /auth/register` returns **202 with no token**. The
response is deliberately identical whether or not the address was already registered — that
uniformity is what closes the account-enumeration oracle, and a duplicate cannot be handed a
token.

`AuthContext.register()` previously read `response.access_token` and **threw** when it was
missing, so against a 2.x runtime every registration failed with a misleading *"Authentication
did not return an access token"*. It now resolves to:

```js
{ verificationSent: true, token: null }
```

**Callers must render "check your email" rather than navigating to an authenticated view.**

A 1.x runtime that still returns a token is tolerated — that path resolves to
`{ verificationSent: false, token }` and signs the user in as before, so the UI can be
upgraded ahead of the backend instead of requiring a lockstep deploy.

### Added — the rest of the v2 auth surface

- `verifyEmail(token)` / `AuthContext.verify()` — consumes the emailed link and signs the
  user in.
- `changePassword(current, next)` / `AuthContext.changeOwnPassword()` — **stores the returned
  token**, which is not optional: the change invalidates every session including this one, so
  keeping the old token 401s on the next request.
- `forgotPassword(email)` — resolves identically whether or not the address is registered.
  Do not branch on the result to tell the user whether an account exists.
- `resetPassword(token, newPassword)` — returns no token; the user signs in afresh.

### Changed — react-router peer range widened to `^6.0.0 || ^7.0.0`

Unblocks the platform SPA's react-router 7 upgrade, which was failing `npm ERESOLVE` against
this package's `^6.0.0` pin.

Verified rather than assumed: this package uses only `NavLink`, `Outlet`, `Navigate` and
`useLocation`, all stable across the v6→v7 boundary (that major's breaks were in the data
APIs). Lint and the library build both pass against `react-router-dom@7.18.2`. The dev
dependency stays on v6 so the default build continues to exercise the lower bound.

## [1.0.2] - 2026-05-28

### Fixed

- Added `repository` field to `package.json`, required for npm provenance validation.
- `loginUser`, `registerUser`, and `bootIdentity` now call `.then(unwrapEnvelope)` on
  the raw API response. Callers receive the unwrapped data payload directly instead of
  the `{ data: {...} }` envelope object.
- `bootIdentity` now correctly surfaces `system.runtime.boot_mode`, allowing
  `PlatformHomeRedirect` to route to `/agent` vs `/flows` after a successful login.
  Without the unwrap, `useSystem()` could not read `boot_mode` and the post-login
  redirect silently misfired.

> **Note:** 1.0.1 was tagged but never published to npm. The missing `repository` field
> caused provenance validation to fail during the OIDC publish attempt. 1.0.2 supersedes
> it with the same fixes plus the corrected metadata.

# Changelog

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

# Changelog

## [1.0.1] - 2026-05-28

### Fixed

- `loginUser`, `registerUser`, and `bootIdentity` now call `.then(unwrapEnvelope)` on
  the raw API response. Callers receive the unwrapped data payload directly instead of
  the `{ data: {...} }` envelope object.
- Second-order fix: `bootIdentity` now correctly surfaces `system.runtime.boot_mode`,
  allowing `PlatformHomeRedirect` to route to `/agent` vs `/flows` after a successful
  login. Without the unwrap, `useSystem()` could not read `boot_mode` and the
  post-login redirect silently misfired.

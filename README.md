# @aindy/ui-kit

Shared UI components, React contexts, and API core for **AINDY platform** frontends.

`@aindy/ui-kit` is the client-side counterpart to the [`aindy-runtime`](https://pypi.org/project/aindy-runtime/)
backend: it centralizes the authenticated HTTP layer, the canonical backend route table,
auth/session contexts, and a small set of shared components and UI primitives so every
frontend built on the runtime talks to it the same way. It is published to npm and consumed
as a compiled bundle (`dist/` is built at publish time, not committed).

## Install

```bash
npm install @aindy/ui-kit
```

**Peer dependencies** (provided by the host app):

- `react` ^19
- `react-dom` ^19
- `react-router-dom` ^6

## What it exports

### API core (`./api/_core.js`)

The authenticated request layer against the runtime. `buildApiUrl` prepends `API_BASE` to a
`ROUTES` value; the `request` family attaches the stored token and returns the parsed body.

| Export | Purpose |
|---|---|
| `request`, `authRequest`, `adminRequest`, `taggedRequest`, `requestAbsolute` | HTTP calls (auth-scoped / admin-scoped / cache-tagged / absolute-URL variants) |
| `buildApiUrl` | Resolve a `ROUTES` value against `API_BASE` |
| `getStoredToken`, `setStoredToken`, `clearStoredToken` | JWT storage |
| `unwrapEnvelope` | Unwrap the runtime's `{ data: … }` response envelope |
| `ApiError` | Typed error carrying status + body |
| `API_BASE` | Build-time API base (`VITE_API_BASE_URL`, default `""` — relative to origin) |

### Routes (`./api/_routes.js`)

- `ROUTES` — the canonical backend route table. **Every runtime/platform route carries the
  full `/platform` prefix** (e.g. `ROUTES.OPERATOR.FLOW_STRATEGIES` → `/platform/flows/strategies`).
  A value that drops the prefix segment 404s.
- `FEATURE_FLAGS` — NavLink gates for routes that are conditionally served; flip a flag to
  `true` when its backing runtime route lands.

> **Runtime routes vs app routes.** `ROUTES` should carry **runtime/platform** paths only —
> these are shared by every consumer, and the runtime's authoritative list lives in
> [`aindy-runtime` `docs/runtime/UI_CONTRACT.md`](https://github.com/Masterplanner25/aindy-runtime/blob/main/docs/runtime/UI_CONTRACT.md).
> **App-domain** paths (e.g. `/compute/*` analytics, `/seo/*`) are **not** runtime routes and
> must not be baked into this shared kit; a consuming app owns those in its own route map that
> spreads and extends `ROUTES` (mirroring the backend's runtime/app split).

### Auth (`./api/auth.js`)

`bootIdentity`, `loginUser`, `registerUser`.

> **Invariant:** all three must `.then(unwrapEnvelope)` — `bootIdentity` populates
> `system.runtime.boot_mode` (read by the post-login redirect); returning the raw envelope
> silently breaks it.

### Contexts

- `AuthProvider` / `useAuth` — session + identity.
- `SystemProvider` / `useSystem` — runtime system state (incl. `boot_mode`).

### Components

`AppShell`, `ProtectedRoute`, `VersionMismatchBanner`, `Toast`, `LoadingPanel`,
`DomainError`, `AdminAccessRequired` (+ `useAdminApiGuard`), `EmptyState`.

### UI primitives

`Button` (+ `buttonVariants`), the `Card` family (`Card`, `CardHeader`, `CardTitle`,
`CardDescription`, `CardContent`, `CardFooter`), the `Tooltip` family (`Tooltip`,
`TooltipTrigger`, `TooltipContent`, `TooltipProvider`).

### Utilities

`cn` (class merge), `APPROVAL_EVENT`, `useApiCall`, `useToast`, `safeArray`, `safeMap`.

## Usage

```jsx
import {
  AuthProvider, SystemProvider, ProtectedRoute, AppShell,
  ROUTES, request, unwrapEnvelope,
} from "@aindy/ui-kit";

function App() {
  return (
    <AuthProvider>
      <SystemProvider>
        <AppShell>{/* routes */}</AppShell>
      </SystemProvider>
    </AuthProvider>
  );
}

// A backend call through the canonical route table:
const strategies = await request(ROUTES.OPERATOR.FLOW_STRATEGIES).then(unwrapEnvelope);
```

## Development

```bash
npm run build    # vite build → dist/ (index.js, index.cjs, index.d.ts)
npm run lint     # eslint src
npm test         # vitest
```

## Versioning & the runtime

`@aindy/ui-kit` and `aindy-runtime` are **independently versioned**. This package *consumes*
the runtime's HTTP contract; the runtime does not depend on it. A ui-kit release does **not**
require a runtime release (and vice versa) — a runtime bump is only relevant when a ui-kit
change depends on a *new* runtime route or behavior. Keep `ROUTES` in sync with the runtime's
`docs/runtime/UI_CONTRACT.md`; a route that drifts from a served backend path is the
`UIKIT-ROUTE-DRIFT-1` failure mode.

## Publishing

`dist/` is gitignored and built fresh at publish:

```bash
npm version patch        # e.g. 1.0.5 → 1.0.6
npm run build
npm publish
```

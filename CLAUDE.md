# aindy-ui-kit — Claude Code Instructions

## What this repo is

Shared React component library, API core, and contexts for the AINDY platform.
Published to npm as `@aindy/ui-kit`. Consumed by `aindy-runtime/platform/`.

Source: `src/`  
Built output: `dist/` (Vite library build)  
Auth API (envelope-unwrap invariant): `src/api/auth.js`

---

## Releasing a new version

```bash
# 1. Bump version in package.json
npm version X.Y.Z --no-git-tag-version

# 2. Update CHANGELOG.md — add entry at top

# 3. Commit
git add package.json CHANGELOG.md
git commit -m "release: X.Y.Z — <summary>"

# 4. Tag and push (triggers publish workflow)
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

The publish workflow validates that the tag matches `package.json` version, runs lint/tests,
builds, verifies the tarball, publishes to npm via OIDC, then creates a GitHub release.

**After publishing:** bump `@aindy/ui-kit` in `aindy-runtime/platform/package.json` and run
`npm install` there to update the lockfile.

---

## npm OIDC trusted publishing — how it works and what breaks it

The publish workflow uses OIDC trusted publishing (no long-lived `NPM_TOKEN` needed).
This is non-obvious and breaks in specific ways. Read this before debugging a failed publish.

### npmjs.com side — one-time setup

Configure a Trusted Publisher on npmjs.com → `@aindy/ui-kit` → Settings → Trusted Publishers:

| Field | Value | Notes |
|---|---|---|
| Publisher | GitHub Actions | |
| Owner | `Masterplanner25` | **CASE-SENSITIVE** — must match GitHub username exactly |
| Repository | `aindy-ui-kit` | Repo name only, not `owner/repo` |
| Workflow filename | `publish.yml` | Filename only, not the `.github/workflows/` path |
| Environment | `npm-production` | Exact match |
| Allowed actions | Publish | Must check at least one |

The `Masterplanner25` casing is critical. The GitHub OIDC token sends the owner with its
exact case. npmjs.com compares literally. `masterplanner25 ≠ Masterplanner25` → silent
ENEEDAUTH with no useful error message.

### Workflow side — the `actions/setup-node` trap

`actions/setup-node` with `registry-url` automatically injects `NODE_AUTH_TOKEN` set to
`github.token` (the runner's GitHub token). npm sees this and uses it for npm auth instead
of OIDC → E404 (npmjs.com doesn't accept a GitHub token).

The fix in this workflow:
1. Keep `registry-url` (needed for `.npmrc` registry config — without it, npm fails ENEEDAUTH
   before attempting OIDC at all)
2. After `setup-node`, rewrite `.npmrc` to strip the `_authToken` line:
   `printf "registry=https://registry.npmjs.org/\n" > "$NPM_CONFIG_USERCONFIG"`
3. Publish from an extracted directory, not from the `.tgz` directly:
   `tar xzf *.tgz && npm publish package/ --provenance --access public`

### npm version requirement

Node 20 ships npm 10.x which cannot complete the OIDC handshake. The publish job uses
Node 24 + `npm install -g npm@latest` to guarantee npm 11.x.

### Error legend

| Error | Cause |
|---|---|
| `E404 Not found` | `github.token` injected by `setup-node` — strip `_authToken` from `.npmrc` |
| `ENEEDAUTH` (fast, no network) | No registry config — don't remove `registry-url` entirely |
| `ENEEDAUTH` (after ~1s) | OIDC exchange failed — check npmjs.com Trusted Publisher config |
| `EOTP` | Classic `NPM_TOKEN` being used with 2FA enabled — remove the token, use OIDC |

---

## package.json requirements for provenance

The `repository` field must be present. Without it, npm provenance validation fails during
publish:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/Masterplanner25/aindy-ui-kit.git"
}
```

`publishConfig.access: "public"` is also required for the `@aindy` scoped package.

---

## Envelope-unwrap invariant

`loginUser`, `registerUser`, and `bootIdentity` in `src/api/auth.js` must each call
`.then(unwrapEnvelope)` on the raw API response. The API returns `{ data: {...} }` and
callers expect the inner payload directly. Without the unwrap:
- `bootIdentity` fails to surface `system.runtime.boot_mode`
- `PlatformHomeRedirect` in the consumer cannot route to `/agent` vs `/flows`
- Post-login redirect silently misfires

Do not remove the `unwrapEnvelope` calls from these three functions.

---

## Build output locations

| What | Path |
|---|---|
| Source | `src/` |
| Built dist (published to npm) | `dist/` |
| Consumer source | `C:\dev\aindy-runtime\platform\src\` |
| Consumer build output (served by container) | `C:\dev\aindy-runtime\AINDY\platform\dist\` |

The Docker container installs `@aindy/ui-kit` from npm during the `ui-builder` stage —
it does not copy local `dist/`. Local source edits require a publish (or a manual copy
into `platform/node_modules/@aindy/ui-kit/dist/`) to take effect in the container.

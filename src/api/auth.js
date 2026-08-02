import { getStoredToken, request, unwrapEnvelope } from "./_core.js";
import { ROUTES } from "./_routes.js";

export function loginUser(credentials) {
  return request(ROUTES.AUTH.LOGIN, {
    method: "POST",
    body: JSON.stringify(credentials),
  }).then(unwrapEnvelope);
}

/**
 * Begin registration. Against runtime >= 2.0.0 this resolves to
 * `{ status: "verification_sent" }` and **carries no access token** — the response is
 * deliberately identical whether or not the address was already registered, which is what
 * closes the account-enumeration oracle. The token is issued by `verifyEmail` once the
 * emailed link is followed.
 */
export function registerUser(credentials) {
  return request(ROUTES.AUTH.REGISTER, {
    method: "POST",
    body: JSON.stringify(credentials),
  }).then(unwrapEnvelope);
}

/** Consume an emailed verification token and receive the access token. */
export function verifyEmail(token) {
  return request(ROUTES.AUTH.VERIFY_EMAIL, {
    method: "POST",
    body: JSON.stringify({ token }),
  }).then(unwrapEnvelope);
}

/**
 * Rotate the signed-in user's password.
 *
 * Returns a freshly-versioned access token. **It must be stored** — the change invalidates
 * every session including this one, so keeping the old token 401s on the next request.
 */
export function changePassword(currentPassword, newPassword, token = getStoredToken()) {
  return request(ROUTES.AUTH.PASSWORD_CHANGE, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  }).then(unwrapEnvelope);
}

/**
 * Begin password recovery.
 *
 * Resolves identically whether or not the address is registered — do not branch on the
 * result to tell the user whether an account exists, that is the oracle this avoids. A 503
 * means the deployment has no email channel configured, which is about the deployment and
 * not about any account.
 */
export function forgotPassword(email) {
  return request(ROUTES.AUTH.PASSWORD_FORGOT, {
    method: "POST",
    body: JSON.stringify({ email }),
  }).then(unwrapEnvelope);
}

/**
 * Complete password recovery with an emailed token.
 *
 * Returns no access token — unlike `changePassword`, the caller has not proven they hold a
 * session, so they sign in afresh.
 */
export function resetPassword(token, newPassword) {
  return request(ROUTES.AUTH.PASSWORD_RESET, {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  }).then(unwrapEnvelope);
}

export function logoutUser(token = getStoredToken()) {
  return request(ROUTES.AUTH.LOGOUT, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => null);
}

export function bootIdentity(token = getStoredToken()) {
  return request(ROUTES.IDENTITY.BOOT, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then(unwrapEnvelope);
}

import { getStoredToken, request, unwrapEnvelope } from "./_core.js";
import { ROUTES } from "./_routes.js";

export function loginUser(credentials) {
  return request(ROUTES.AUTH.LOGIN, {
    method: "POST",
    body: JSON.stringify(credentials),
  }).then(unwrapEnvelope);
}

export function registerUser(credentials) {
  return request(ROUTES.AUTH.REGISTER, {
    method: "POST",
    body: JSON.stringify(credentials),
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

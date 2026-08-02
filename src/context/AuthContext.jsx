import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { clearStoredToken, getStoredToken, setStoredToken } from "../api/_core.js";
import {
  changePassword,
  loginUser,
  logoutUser,
  registerUser,
  verifyEmail,
} from "../api/auth.js";

const AuthContext = createContext(null);

function parseJwtPayload(token) {
  if (!token) {
    return null;
  }

  try {
    const [, payload = ""] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return false;
  }
  return Date.now() / 1000 > payload.exp - 30;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = getStoredToken();
    if (stored && isTokenExpired(stored)) {
      clearStoredToken();
      return null;
    }
    return stored || null;
  });
  const user = useMemo(() => {
    const payload = parseJwtPayload(token);
    if (!payload) {
      return null;
    }
    return {
      ...payload,
      is_admin: payload?.is_admin === true,
    };
  }, [token]);
  const isAdmin = user?.is_admin === true;

  useEffect(() => {
    const stored = getStoredToken();
    if (stored && isTokenExpired(stored)) {
      clearStoredToken();
      setToken(null);
      return;
    }
    setToken(stored || null);
  }, []);

  useEffect(() => {
    if (!token) {
      return undefined;
    }
    const interval = setInterval(() => {
      if (isTokenExpired(token)) {
        clearStoredToken();
        setToken(null);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const handleExpiry = () => {
      clearStoredToken();
      setToken(null);
    };
    window.addEventListener("aindy:session-expired", handleExpiry);
    return () => window.removeEventListener("aindy:session-expired", handleExpiry);
  }, []);

  const login = async (email, password) => {
    const response = await loginUser({ email, password });
    const nextToken = response?.access_token;
    if (!nextToken) {
      throw new Error("Authentication did not return an access token.");
    }
    setStoredToken(nextToken);
    setToken(nextToken);
    return nextToken;
  };

  /**
   * Begin registration. Against runtime >= 2.0.0 this does NOT sign the user in.
   *
   * Registration returns 202 with no token, deliberately: the response is identical
   * whether or not the address was already registered, which is what closes the
   * account-enumeration oracle — and a duplicate cannot be handed a token. The caller
   * should render "check your email", not navigate to an authenticated view.
   *
   * The previous implementation read `response.access_token` and threw when it was
   * missing, so against a 2.x runtime every registration failed with a misleading
   * "did not return an access token" error.
   */
  const register = async (email, password, username = null) => {
    const response = await registerUser({ email, password, username });

    // Tolerate a 1.x runtime, which still returns a token here. This lets the UI upgrade
    // ahead of the backend rather than requiring a lockstep deploy.
    const legacyToken = response?.access_token;
    if (legacyToken) {
      setStoredToken(legacyToken);
      setToken(legacyToken);
      return { verificationSent: false, token: legacyToken };
    }

    return { verificationSent: true, token: null };
  };

  /** Consume an emailed verification token; signs the user in on success. */
  const verify = async (verificationToken) => {
    const response = await verifyEmail(verificationToken);
    const nextToken = response?.access_token;
    if (!nextToken) {
      throw new Error("Verification did not return an access token.");
    }
    setStoredToken(nextToken);
    setToken(nextToken);
    return nextToken;
  };

  /**
   * Rotate the current user's password.
   *
   * Stores the returned token. This is not optional: the change bumps `token_version`,
   * invalidating every session including this one, so keeping the old token would 401 on
   * the very next request.
   */
  const changeOwnPassword = async (currentPassword, newPassword) => {
    const response = await changePassword(currentPassword, newPassword);
    const nextToken = response?.access_token;
    if (nextToken) {
      setStoredToken(nextToken);
      setToken(nextToken);
    }
    return nextToken ?? null;
  };

  const logout = () => {
    logoutUser();
    clearStoredToken();
    setToken(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAdmin,
      isAuthenticated: Boolean(token),
      login,
      register,
      verify,
      changeOwnPassword,
      logout,
      setToken,
    }),
    [token, user, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}

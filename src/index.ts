// API core
export {
  ApiError,
  adminRequest,
  authRequest,
  authRequestExternal,
  buildApiUrl,
  clearStoredToken,
  getStoredToken,
  request,
  requestAbsolute,
  setStoredToken,
  taggedRequest,
  unwrapEnvelope,
  API_BASE,
} from "./api/_core.js";

export { ROUTES } from "./api/_routes.js";
export { bootIdentity, loginUser, registerUser } from "./api/auth.js";

// Contexts
export { AuthProvider, useAuth } from "./context/AuthContext";
export { SystemProvider, useSystem } from "./context/SystemContext";

// Shared components
export { default as AppShell } from "./components/shared/AppShell";
export { default as ProtectedRoute } from "./components/shared/ProtectedRoute";
export { VersionMismatchBanner } from "./components/shared/VersionMismatchBanner";
export { Toast } from "./components/shared/Toast";
export { LoadingPanel } from "./components/shared/LoadingPanel";
export { DomainError } from "./components/shared/DomainError";
export { AdminAccessRequired, useAdminApiGuard } from "./components/shared/AdminApiErrorBoundary";
export { EmptyState } from "./components/shared/EmptyState";

// UI primitives
export { Button, buttonVariants } from "./components/shared/ui/button";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/shared/ui/card";
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/shared/ui/tooltip";

// Utilities
export { cn } from "./lib/utils";
export { APPROVAL_EVENT } from "./lib/platformEvents";
export { useApiCall } from "./lib/useApiCall";
export { safeArray, safeMap } from "./utils/safe";
export { useToast } from "./utils/useToast";

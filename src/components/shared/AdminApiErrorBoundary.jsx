import { useEffect, useState } from "react";

export function useAdminApiGuard(isAdmin) {
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setForbidden(true);
    }
  }, [isAdmin]);

  return forbidden;
}

export function AdminAccessRequired() {
  return (
    <div
      role="alert"
      className="flex min-h-[200px] items-center justify-center rounded-2xl border border-red-500/20 bg-zinc-950/80 p-8 text-center"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-red-400">
          Admin Access Required
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          This panel is only available to administrator accounts.
        </p>
      </div>
    </div>
  );
}

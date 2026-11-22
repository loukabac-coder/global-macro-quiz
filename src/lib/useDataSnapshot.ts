import { useEffect, useState } from "react";
import { DATA_REFRESH_MS, isAtLeastAsRecent, type SnapshotDates } from "@/lib/dataFreshness";

export function useDataSnapshot<T extends SnapshotDates>(read: () => Promise<T | null>) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; unreachable: boolean; now: number }>({
    data: null, loading: true, unreachable: false, now: 0,
  });

  useEffect(() => {
    let active = true;
    let pending = false;
    async function load() {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        const data = await read().catch(() => null);
        if (active) setState((previous) => {
          const received = data && (!previous.data || isAtLeastAsRecent(data, previous.data)) ? data : null;
          return { data: received ?? previous.data, loading: false, unreachable: !received, now: Date.now() };
        });
      } finally {
        pending = false;
      }
    }
    void load();
    const timer = window.setInterval(load, DATA_REFRESH_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [read]);

  return state;
}

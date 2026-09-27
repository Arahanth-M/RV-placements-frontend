import { useEffect, useRef, useState } from "react";

const DEFAULT_MS = 320;

/** Brief shimmer when user changes prep role tab. */
export function usePrepRoleSwitchTransition(activeKey, durationMs = DEFAULT_MS) {
  const [switching, setSwitching] = useState(false);
  const first = useRef(true);
  const timer = useRef(null);
  const stableKey = activeKey ?? "";

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    if (stableKey === "__static__") return undefined;
    setSwitching(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSwitching(false), durationMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [stableKey, durationMs]);

  return switching;
}

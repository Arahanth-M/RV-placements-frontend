import { useEffect, useRef } from "react";
import { useAuth } from "../utils/AuthContext";
import { BASE_URL } from "../utils/constants";
import { registerDauPresenceFlush } from "../utils/dauPresenceFlush";

const HEARTBEAT_MS = 45_000;
const IDLE_MS = 3 * 60_000;
const LOCK_KEY = "dauPresenceLeader";
const LOCK_STALE_MS = 70_000;
const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function isLeaderTab() {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    const lock = raw ? JSON.parse(raw) : null;
    const ts = Number(lock?.ts);
    const stale = !lock?.id || !Number.isFinite(ts) || Date.now() - ts > LOCK_STALE_MS;
    if (stale || lock.id === TAB_ID) {
      localStorage.setItem(
        LOCK_KEY,
        JSON.stringify({ id: TAB_ID, ts: Date.now() })
      );
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

function sendHeartbeat({ deltaMs, flush, keepalive }) {
  const body = JSON.stringify({
    deltaMs: Math.max(0, Math.floor(Number(deltaMs) || 0)),
    flush: flush === true,
  });
  const url = `${BASE_URL}/api/dau/heartbeat`;
  if (keepalive && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
      if (navigator.sendBeacon(url, blob)) return Promise.resolve();
    } catch {
      // fall through to fetch
    }
  }
  return fetch(url, {
    method: "POST",
    credentials: "include",
    keepalive: Boolean(keepalive),
    headers: { "Content-Type": "application/json" },
    body,
  }).then(
    () => {},
    () => {}
  );
}

/**
 * While logged in: ping engaged time if this tab is visible, the user is not idle,
 * and this tab holds the multi-tab lock. Does not affect page UI.
 */
export default function DauPresenceTracker() {
  const { user } = useAuth();
  const lastSentAtRef = useRef(Date.now());
  const lastActivityAtRef = useRef(Date.now());

  useEffect(() => {
    if (!user) {
      registerDauPresenceFlush(null);
      return undefined;
    }

    lastSentAtRef.current = Date.now();
    lastActivityAtRef.current = Date.now();

    const markActivity = () => {
      const now = Date.now();
      const wasIdle = now - lastActivityAtRef.current > IDLE_MS;
      lastActivityAtRef.current = now;
      if (wasIdle) lastSentAtRef.current = now;
    };

    const ping = ({ flush = false, keepalive = false, force = false } = {}) => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return Promise.resolve();
      }
      const leader = isLeaderTab();
      if (!flush && !leader) {
        return Promise.resolve();
      }
      if (flush && !force && !leader) {
        return Promise.resolve();
      }
      const now = Date.now();
      const deltaMs = now - lastSentAtRef.current;
      lastSentAtRef.current = now;
      return sendHeartbeat({ deltaMs, flush, keepalive });
    };

    const maybeTick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      if (Date.now() - lastActivityAtRef.current > IDLE_MS) return;
      void ping({ flush: false, keepalive: false });
    };

    const onHidden = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") return;
      void ping({ flush: true, keepalive: true, force: false });
      try {
        const raw = localStorage.getItem(LOCK_KEY);
        const lock = raw ? JSON.parse(raw) : null;
        if (lock?.id === TAB_ID) localStorage.removeItem(LOCK_KEY);
      } catch {
        // ignore
      }
    };

    registerDauPresenceFlush(() => ping({ flush: true, keepalive: true, force: true }));

    const intervalId = window.setInterval(maybeTick, HEARTBEAT_MS);
    window.addEventListener("pointerdown", markActivity, { passive: true });
    window.addEventListener("keydown", markActivity);
    window.addEventListener("mousemove", markActivity, { passive: true });
    window.addEventListener("scroll", markActivity, { passive: true });
    window.addEventListener("touchstart", markActivity, { passive: true });
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onHidden);

    return () => {
      registerDauPresenceFlush(null);
      window.clearInterval(intervalId);
      window.removeEventListener("pointerdown", markActivity);
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("mousemove", markActivity);
      window.removeEventListener("scroll", markActivity);
      window.removeEventListener("touchstart", markActivity);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onHidden);
    };
  }, [user]);

  return null;
}

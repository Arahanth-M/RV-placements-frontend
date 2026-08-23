/** Registered by DauPresenceTracker so logout can flush engaged time before the cookie is cleared. */

let flushFn = null;

export function registerDauPresenceFlush(fn) {
  flushFn = typeof fn === "function" ? fn : null;
}

export async function flushDauPresence() {
  if (typeof flushFn !== "function") return;
  try {
    await flushFn();
  } catch {
    // never block logout
  }
}

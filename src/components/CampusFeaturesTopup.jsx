import { useCallback, useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useAuth } from "../utils/AuthContext";
import { authAPI } from "../utils/api";
import { GENERAL_BASE } from "../constants/tenant.js";

const FRESH_LOGIN_KEY = "campusFeaturesTopupFreshLogin";
const AUTO_DISMISS_MS = 15_000;

function dismissStorageKey(collegeId, userId) {
  return `campusFeaturesTopup_${String(collegeId || "")}_${String(userId || "")}`;
}

function featureFingerprint(selectedFeatures = [], featuresUpdatedAt = null) {
  const ids = (Array.isArray(selectedFeatures) ? selectedFeatures : [])
    .map((id) => String(id || "").trim().toLowerCase())
    .filter(Boolean)
    .sort();
  const updated = featuresUpdatedAt ? String(featuresUpdatedAt) : "";
  return `${ids.join("|")}::${updated}`;
}

function readDismissedFingerprint(collegeId, userId) {
  try {
    const raw = localStorage.getItem(dismissStorageKey(collegeId, userId));
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return String(parsed?.fingerprint || "");
  } catch {
    return "";
  }
}

function writeDismissedFingerprint(collegeId, userId, fingerprint) {
  try {
    localStorage.setItem(
      dismissStorageKey(collegeId, userId),
      JSON.stringify({ fingerprint, dismissedAt: new Date().toISOString() })
    );
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Post-login campus top-up: subscribed features + CTA to use personal email on General.
 * Auto-closes after 15s. Optional “don’t show again until features change”.
 */
export default function CampusFeaturesTopup() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [busyCta, setBusyCta] = useState(false);
  const fingerprintRef = useRef("");
  const closedRef = useRef(false);
  const dontShowAgainRef = useRef(false);
  const configRef = useRef(null);

  useEffect(() => {
    dontShowAgainRef.current = dontShowAgain;
  }, [dontShowAgain]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const closeModal = useCallback((persistOptOut) => {
    if (closedRef.current) return;
    closedRef.current = true;
    const cfg = configRef.current;
    if (persistOptOut && fingerprintRef.current && user) {
      writeDismissedFingerprint(
        cfg?.collegeId || user.collegeId,
        user.userId || user._id,
        fingerprintRef.current
      );
    }
    setOpen(false);
  }, [user]);

  useEffect(() => {
    const userId = user?.userId || user?._id;
    if (!userId) return;
    if (sessionStorage.getItem(FRESH_LOGIN_KEY) !== "1") return;
    sessionStorage.removeItem(FRESH_LOGIN_KEY);

    let cancelled = false;
    (async () => {
      try {
        const { data } = await authAPI.getCollegeFeatures();
        if (cancelled) return;
        const fp = featureFingerprint(data?.selectedFeatures, data?.featuresUpdatedAt);
        fingerprintRef.current = fp;
        const dismissed = readDismissedFingerprint(
          data?.collegeId || user.collegeId,
          userId
        );
        if (dismissed && dismissed === fp) return;
        setConfig(data || null);
        setOpen(true);
        setSecondsLeft(15);
        closedRef.current = false;
      } catch (err) {
        console.warn("[CampusFeaturesTopup] load failed:", err?.message || err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.userId, user?._id, user?.collegeId]);

  useEffect(() => {
    if (!open) return undefined;
    const started = Date.now();
    const tick = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((AUTO_DISMISS_MS - (Date.now() - started)) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        window.clearInterval(tick);
        closeModal(dontShowAgainRef.current);
      }
    }, 250);
    return () => window.clearInterval(tick);
  }, [open, closeModal]);

  const goToGeneralPersonal = async () => {
    setBusyCta(true);
    try {
      if (dontShowAgain) {
        closeModal(true);
      }
      await logout();
      window.location.assign(`${GENERAL_BASE}?reason=use_personal_email`);
    } catch {
      window.location.assign(`${GENERAL_BASE}?reason=use_personal_email`);
    }
  };

  if (!open || !config) return null;

  const features = Array.isArray(config.features) ? config.features : [];
  const collegeName = config.collegeName || "your campus";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campus-features-topup-title"
    >
      <div className="relative w-full max-w-lg max-h-[min(90vh,640px)] overflow-y-auto rounded-2xl border border-theme bg-theme-card shadow-2xl p-5 sm:p-6">
        <button
          type="button"
          onClick={() => closeModal(dontShowAgain)}
          className="absolute right-3 top-3 rounded-lg p-2 text-theme-secondary hover:text-theme-primary"
          aria-label="Close"
        >
          <FaTimes className="h-4 w-4" />
        </button>

        <p className="text-xs font-semibold uppercase tracking-wider text-theme-accent">
          Campus access · {collegeName}
        </p>
        <h2
          id="campus-features-topup-title"
          className="mt-1 text-xl font-semibold text-theme-primary pr-8"
        >
          Features included with your college login
        </h2>
        <p className="mt-2 text-sm text-theme-secondary leading-relaxed">
          You signed in with your college email, so you get the campus package below. For more
          product features, sign in to the <span className="font-semibold">General</span> dashboard
          with a personal Google account.
        </p>

        <div className="mt-4 rounded-xl border border-theme bg-theme-hero/50 px-4 py-3">
          {features.length === 0 ? (
            <p className="text-sm text-theme-secondary">
              Your campus hasn&apos;t published a subscribed feature list yet. You can still use
              campus tools that are already enabled — or open General with a personal email for the
              full product.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {features.map((f) => (
                <li key={f.id} className="text-sm">
                  <span className="font-semibold text-theme-primary">{f.title}</span>
                  {f.text ? (
                    <span className="block text-xs text-theme-secondary mt-0.5">{f.text}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="mt-4 flex items-start gap-2.5 text-sm text-theme-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="mt-1"
          />
          <span>Don&apos;t show again until campus features change</span>
        </label>

        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-theme-secondary">Closes in {secondsLeft}s</p>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => closeModal(dontShowAgain)}
              className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-secondary hover:text-theme-primary"
            >
              Continue on campus
            </button>
            <button
              type="button"
              onClick={goToGeneralPersonal}
              disabled={busyCta}
              className="rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busyCta ? "Redirecting…" : "Use personal email on General"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { FRESH_LOGIN_KEY as CAMPUS_FEATURES_TOPUP_FRESH_LOGIN_KEY };

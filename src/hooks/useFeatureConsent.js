import { useCallback, useState } from "react";
import { useAuth } from "../utils/AuthContext";
import { authAPI } from "../utils/api";
import {
  featureNeedsConsent,
  requiredFeatureConsentVersion,
} from "../constants/featureConsents.js";

/**
 * Ensure a feature-level DPDP consent is recorded on the user (server-backed).
 * Returns true if consent is already present or was just accepted.
 */
export function useFeatureConsent() {
  const { user, setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const needsConsent = useCallback(
    (featureId) => featureNeedsConsent(user, featureId),
    [user]
  );

  const requiredVersion = useCallback(
    (featureId) => requiredFeatureConsentVersion(user, featureId),
    [user]
  );

  const ensureAccepted = useCallback(
    async (featureId) => {
      setError("");
      if (!featureNeedsConsent(user, featureId)) {
        return true;
      }
      const version = requiredFeatureConsentVersion(user, featureId);
      if (!version) {
        setError("Consent version is missing. Refresh and try again.");
        return false;
      }
      setBusy(true);
      try {
        const { data } = await authAPI.acceptFeatureConsent({
          feature: featureId,
          version,
          accepted: true,
        });
        const next = data?.featureConsents;
        if (next) {
          setUser((prev) => {
            if (!prev) return prev;
            const merged = { ...prev, featureConsents: next };
            try {
              localStorage.setItem("lastUser", JSON.stringify(merged));
            } catch {
              /* ignore */
            }
            return merged;
          });
        }
        const stillNeeds = next?.[featureId]?.needsConsent === true;
        if (stillNeeds) {
          setError("Consent was not saved. Please try again.");
          return false;
        }
        return true;
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Could not save consent. Please try again."
        );
        return false;
      } finally {
        setBusy(false);
      }
    },
    [user, setUser]
  );

  return {
    needsConsent,
    requiredVersion,
    ensureAccepted,
    busy,
    error,
    setError,
  };
}

import React, { useCallback, useEffect, useState } from "react";
import { adminAPI } from "../utils/api";
import {
  DEFAULT_OPEN_DREAM_MIN_LPA,
  PLACEMENT_HUB_CLUSTER_KEYS,
  PLACEMENT_HUB_CLUSTER_LABELS,
} from "../constants/placementTiers.js";
import { PLACEMENT_OPEN_DREAM_SETTING_YEARS } from "../constants/placementYears.js";

function defaultThresholdsForYear() {
  return Object.fromEntries(
    PLACEMENT_HUB_CLUSTER_KEYS.map((k) => [k, DEFAULT_OPEN_DREAM_MIN_LPA])
  );
}

function defaultThresholdsByYear() {
  return Object.fromEntries(
    PLACEMENT_OPEN_DREAM_SETTING_YEARS.map((y) => [String(y), defaultThresholdsForYear()])
  );
}

const PlacementHubSettingsTab = ({ onToast }) => {
  const [selectedYear, setSelectedYear] = useState(
    String(PLACEMENT_OPEN_DREAM_SETTING_YEARS[PLACEMENT_OPEN_DREAM_SETTING_YEARS.length - 1])
  );
  const [thresholdsByYear, setThresholdsByYear] = useState(defaultThresholdsByYear);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getPlacementHubSettings();
      const fromApi = res.data?.openDreamMinLpaByYear;
      const next = defaultThresholdsByYear();
      if (fromApi && typeof fromApi === "object") {
        for (const year of PLACEMENT_OPEN_DREAM_SETTING_YEARS) {
          const yearKey = String(year);
          const clusterMap = fromApi[yearKey];
          if (!clusterMap || typeof clusterMap !== "object") continue;
          for (const cluster of PLACEMENT_HUB_CLUSTER_KEYS) {
            const n = Number(clusterMap[cluster]);
            if (Number.isFinite(n) && n >= 0) next[yearKey][cluster] = n;
          }
        }
      }
      setThresholdsByYear(next);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load placement hub settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const thresholds =
    thresholdsByYear[selectedYear] ?? defaultThresholdsForYear();

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await adminAPI.updatePlacementHubSettings({
        openDreamMinLpaByYear: thresholdsByYear,
      });
      const fromApi = res.data?.openDreamMinLpaByYear;
      if (fromApi) {
        setThresholdsByYear({ ...defaultThresholdsByYear(), ...fromApi });
      }
      onToast?.("Open dream thresholds saved for all configured years.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-theme bg-theme-card p-8 text-center text-theme-secondary">
        Loading placement settings…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-theme bg-theme-card p-5 sm:p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-theme-accent">Dream / Open dream thresholds</h2>
      <p className="mt-2 text-sm text-theme-secondary max-w-2xl">
        Set the minimum package (LPA) for <strong>Open dream</strong> vs <strong>Dream</strong> per{" "}
        <strong>placement year</strong> and <strong>hub cluster</strong>. Company stats and filters use the
        year from the URL (<code className="text-xs">?year=</code>) together with the visit cluster.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-700/50 bg-red-900/20 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {PLACEMENT_OPEN_DREAM_SETTING_YEARS.map((year) => {
          const yearKey = String(year);
          const active = selectedYear === yearKey;
          return (
            <button
              key={yearKey}
              type="button"
              onClick={() => setSelectedYear(yearKey)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-indigo-600 text-white"
                  : "border border-theme bg-theme-hero text-theme-secondary hover:bg-theme-card"
              }`}
            >
              {year}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="mt-6 space-y-4">
        <p className="text-sm font-medium text-theme-primary">
          Thresholds for <span className="text-theme-accent">{selectedYear}</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {PLACEMENT_HUB_CLUSTER_KEYS.map((key) => (
            <label
              key={key}
              className="flex flex-col gap-1 rounded-lg border border-theme bg-theme-hero px-4 py-3"
            >
              <span className="text-sm font-medium text-theme-primary">
                {PLACEMENT_HUB_CLUSTER_LABELS[key]}
              </span>
              <span className="text-xs text-theme-muted">Cluster: {key}</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={200}
                  step={0.5}
                  required
                  value={thresholds[key] ?? DEFAULT_OPEN_DREAM_MIN_LPA}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    setThresholdsByYear((prev) => ({
                      ...prev,
                      [selectedYear]: {
                        ...(prev[selectedYear] ?? defaultThresholdsForYear()),
                        [key]: v === "" ? "" : Number(v),
                      },
                    }));
                  }}
                  className="w-28 rounded-md border border-theme bg-theme-card px-3 py-2 text-theme-primary"
                />
                <span className="text-sm text-theme-secondary">LPA min. for Open dream</span>
              </div>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save all years"}
          </button>
          <button
            type="button"
            onClick={loadSettings}
            disabled={saving}
            className="rounded-lg border border-theme px-4 py-2 text-sm text-theme-secondary hover:bg-theme-hero disabled:opacity-60"
          >
            Reset form
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlacementHubSettingsTab;


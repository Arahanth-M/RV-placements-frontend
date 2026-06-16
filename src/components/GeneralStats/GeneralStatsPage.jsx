import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "../PageBackNav.jsx";
import PlacementStatsDashboard from "./PlacementStatsDashboard";
import { placementGeneralStatsAPI } from "../../utils/api";
import {
  DEFAULT_GENERAL_STATS_YEAR,
  GENERAL_STATS_YEARS,
  parseGeneralStatsYear,
} from "../../constants/generalStatsYears";

function YearPill({ year, active, hasData, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "border-indigo-500 bg-indigo-500 text-white"
          : "border-theme bg-theme-card text-theme-primary hover:border-indigo-400/60 hover:bg-theme-hero"
      }`}
    >
      {year}
      {!hasData ? (
        <span className={`ml-1.5 text-[10px] ${active ? "text-indigo-100" : "text-theme-secondary"}`}>
          —
        </span>
      ) : null}
    </button>
  );
}

export default function GeneralStatsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const yearFromUrl = parseGeneralStatsYear(searchParams.get("year"));
  const [selectedYear, setSelectedYear] = useState(yearFromUrl ?? DEFAULT_GENERAL_STATS_YEAR);
  const [availableYears, setAvailableYears] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notAvailable, setNotAvailable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (yearFromUrl != null) {
      setSelectedYear(yearFromUrl);
    }
  }, [yearFromUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await placementGeneralStatsAPI.getYearsMeta();
        if (cancelled) return;
        const avail = Array.isArray(data?.availableYears) ? data.availableYears : [];
        setAvailableYears(avail);
        const defaultYear = parseGeneralStatsYear(data?.defaultYear) ?? DEFAULT_GENERAL_STATS_YEAR;
        const initial =
          yearFromUrl ??
          (avail.includes(DEFAULT_GENERAL_STATS_YEAR)
            ? DEFAULT_GENERAL_STATS_YEAR
            : avail.includes(defaultYear)
              ? defaultYear
              : DEFAULT_GENERAL_STATS_YEAR);
        setSelectedYear(initial);
      } catch {
        if (!cancelled) setAvailableYears([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [yearFromUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      setNotAvailable(false);
      setStats(null);
      try {
        const { data } = await placementGeneralStatsAPI.getByYear(selectedYear);
        if (cancelled) return;
        setStats(data);
      } catch (e) {
        if (cancelled) return;
        if (e?.response?.status === 404) {
          setNotAvailable(true);
        } else {
          setError("Failed to load placement statistics. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSearchParams({ year: String(year) }, { replace: true });
  };

  const availableSet = useMemo(() => new Set(availableYears), [availableYears]);

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate("/")} label="Back" />
        </PageBackNavRow>

        <PageHeroHeader>
          General <em style={{ color: "#818CF8", fontStyle: "italic" }}>Stats</em>
        </PageHeroHeader>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium uppercase tracking-[0.08em] text-theme-secondary">
            Year
          </span>
          {GENERAL_STATS_YEARS.map((year) => (
            <YearPill
              key={year}
              year={year}
              active={selectedYear === year}
              hasData={availableSet.has(year)}
              onClick={() => handleYearChange(year)}
            />
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-theme bg-theme-card px-6 py-16 text-center text-sm text-theme-secondary">
            Loading statistics for {selectedYear}…
          </div>
        ) : notAvailable ? (
          <div className="rounded-2xl border border-theme bg-theme-card px-6 py-16 text-center">
            <p className="text-base font-medium text-theme-primary">
              Placement statistics for {selectedYear} are not available yet.
            </p>
            <p className="mt-2 text-sm text-theme-secondary">
              Try another year from the selector above.
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 px-6 py-16 text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : stats ? (
          <PlacementStatsDashboard stats={stats} />
        ) : null}
      </div>
    </div>
  );
}

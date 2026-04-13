import React, { useState, useEffect } from "react";
import { yearStatsAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import { AnalyticsGridShimmer } from "./StatsLoadingShimmer";

function Analytics({ year = null, embedded = false }) {
  const [data2024, setData2024] = useState([]);
  const [data2025, setData2025] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setError("Please login to view analytics");
        setLoading(false);
        return;
      }

      if (user?.betaAccess === false) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch data for both years in parallel, or just the specified year
        if (year === 2024 || year === null) {
          const res2024 = await yearStatsAPI.getYearStats(2024).catch(() => ({ data: [] }));
          setData2024(res2024.data || []);
          // Debug: log first item to see structure
          if (res2024.data && res2024.data.length > 0) {
            console.log("2024 Data sample:", res2024.data[0]);
            console.log("2024 Data keys:", Object.keys(res2024.data[0]));
          }
        }
        if (year === 2025 || year === null) {
          const res2025 = await yearStatsAPI.getYearStats(2025).catch(() => ({ data: [] }));
          setData2025(res2025.data || []);
          // Debug: log first item to see structure
          if (res2025.data && res2025.data.length > 0) {
            console.log("2025 Data sample:", res2025.data[0]);
            console.log("2025 Data keys:", Object.keys(res2025.data[0]));
          }
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, year]);

  // Helper function to find field names (case-insensitive)
  const findField = (obj, possibleNames) => {
    const keys = Object.keys(obj || {});
    for (const name of possibleNames) {
      const found = keys.find(
        (key) => key.toLowerCase() === name.toLowerCase()
      );
      if (found) return found;
    }
    return null;
  };

  // Extract numeric value from CTC field (values might already be in LPA)
  const extractCTC = (value) => {
    if (typeof value === "number") {
      // If number is less than 100, assume it's already in LPA format
      // Otherwise, assume it's in rupees and convert to LPA
      return value < 100 ? value * 100000 : value;
    }
    if (typeof value === "string") {
      // Remove currency symbols, commas, LPA text, and extract number
      let cleaned = value.replace(/[₹,\s]/gi, "").replace(/lpa/gi, "").replace(/lakhs?/gi, "");
      const num = parseFloat(cleaned);
      if (isNaN(num)) return null;
      // If number is less than 100, assume it's already in LPA format
      return num < 100 ? num * 100000 : num;
    }
    return null;
  };

  // Calculate statistics for a branch
  const calculateBranchStats = (data, branchName) => {
    const branchData = data.filter((item) => {
      const branchField = findField(item, [
        "branch",
        "department",
        "dept",
        "Branch",
        "Department",
      ]);
      if (!branchField) return false;
      const branchValue = String(item[branchField] || "").trim();
      return branchValue.toLowerCase() === branchName.toLowerCase();
    });

    if (branchData.length === 0) {
      return {
        avgCTC: 0,
        highestCTC: 0,
        medianCTC: 0,
      };
    }

    // Extract CTC values - try multiple field names
    const ctcField = findField(branchData[0], [
      "ctc",
      "package",
      "salary",
      "CTC",
      "Package",
      "Salary",
      "ctc_lpa",
      "CTC_LPA",
      "lpa",
      "LPA",
      "annual_ctc",
      "Annual_CTC",
    ]);

    if (!ctcField) {
      console.warn(`No CTC field found for branch ${branchName}. Available fields:`, Object.keys(branchData[0]));
    }

    const ctcValues = branchData
      .map((item) => {
        if (!ctcField) return null;
        const value = item[ctcField];
        const extracted = extractCTC(value);
        if (extracted === null && value !== null && value !== undefined) {
          console.log(`Failed to extract CTC from value:`, value, "for branch:", branchName);
        }
        return extracted;
      })
      .filter((val) => val !== null && val > 0)
      .sort((a, b) => a - b);

    if (ctcValues.length === 0 && branchData.length > 0) {
      console.warn(`No valid CTC values found for branch ${branchName}. Sample item:`, branchData[0]);
    }

    // Calculate statistics
    const avgCTC =
      ctcValues.length > 0
        ? ctcValues.reduce((a, b) => a + b, 0) / ctcValues.length
        : 0;
    const highestCTC = ctcValues.length > 0 ? ctcValues[ctcValues.length - 1] : 0;
    const medianCTC =
      ctcValues.length > 0
        ? ctcValues.length % 2 === 0
          ? (ctcValues[ctcValues.length / 2 - 1] +
              ctcValues[ctcValues.length / 2]) /
            2
          : ctcValues[Math.floor(ctcValues.length / 2)]
        : 0;

    return {
      avgCTC: Math.round(avgCTC),
      highestCTC: Math.round(highestCTC),
      medianCTC: Math.round(medianCTC),
    };
  };

  // Get all unique branches from data
  const getBranches = (data) => {
    if (!data || data.length === 0) return [];

    // Try to find branch field
    const branchField = findField(data[0], [
      "branch",
      "department",
      "dept",
      "Branch",
      "Department",
      "branchName",
      "BranchName",
    ]);

    if (!branchField) {
      console.warn("No branch field found. Available fields:", Object.keys(data[0]));
      return [];
    }

    const branches = new Set();
    data.forEach((item) => {
      const branch = String(item[branchField] || "").trim();
      if (branch) branches.add(branch);
    });

    return Array.from(branches).sort();
  };

  const branches2024 = getBranches(data2024);
  const branches2025 = getBranches(data2025);
  const allBranches = Array.from(new Set([...branches2024, ...branches2025])).sort();

  // Determine which years to display
  const show2024 = year === null || year === 2024;
  const show2025 = year === null || year === 2025;

  // Format currency in LPA
  const formatCurrency = (amount) => {
    if (amount === 0) return "N/A";
    // Convert to LPA (divide by 100000)
    const lpa = amount / 100000;
    return `${lpa.toFixed(2)} LPA`;
  };

  const cardClass =
    "bg-theme-card backdrop-blur border border-theme rounded-xl shadow-lg p-6 hover:shadow-md transition-shadow";

  const content = (
    <>
      {!embedded && (
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-theme-primary mb-8 text-center">
          Placement Analytics
        </h1>
      )}

      {/* Year 2024 Section */}
      {show2024 && (
        <div className="mb-12">
          {!embedded && (
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--primary)] mb-6 text-center">
              2024 Placement Statistics
            </h2>
          )}
          {branches2024.length === 0 ? (
            <div className="bg-theme-card backdrop-blur border border-theme rounded-lg shadow-md p-6 text-center">
              <p className="text-theme-muted">No branch data available for 2024</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches2024.map((branch) => {
                const stats = calculateBranchStats(data2024, branch);
                return (
                  <div key={`2024-${branch}`} className={cardClass}>
                    <h3 className="text-xl font-semibold text-[var(--primary)] mb-4 pb-2 border-b border-theme">
                      {branch}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-theme-muted">Average CTC:</span>
                        <span className="font-semibold text-theme-primary">
                          {formatCurrency(stats.avgCTC)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-theme-muted">Highest CTC:</span>
                        <span className="font-semibold text-[var(--green)]">
                          {formatCurrency(stats.highestCTC)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-theme-muted">Median CTC:</span>
                        <span className="font-semibold text-[var(--primary)]">
                          {formatCurrency(stats.medianCTC)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Year 2025 Section */}
      {show2025 && (
        <div className="mb-12">
          {!embedded && (
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--primary)] mb-6 text-center">
              2025 Placement Statistics
            </h2>
          )}
          {branches2025.length === 0 ? (
            <div className="bg-theme-card backdrop-blur border border-theme rounded-lg shadow-md p-6 text-center">
              <p className="text-theme-muted">No branch data available for 2025</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches2025.map((branch) => {
                const stats = calculateBranchStats(data2025, branch);
                return (
                  <div key={`2025-${branch}`} className={cardClass}>
                    <h3 className="text-xl font-semibold text-[var(--primary)] mb-4 pb-2 border-b border-theme">
                      {branch}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-theme-muted">Average CTC:</span>
                        <span className="font-semibold text-theme-primary">
                          {formatCurrency(stats.avgCTC)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-theme-muted">Highest CTC:</span>
                        <span className="font-semibold text-[var(--green)]">
                          {formatCurrency(stats.highestCTC)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-theme-muted">Median CTC:</span>
                        <span className="font-semibold text-[var(--primary)]">
                          {formatCurrency(stats.medianCTC)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );

  const pageShell = (inner) => (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-theme-app">
      <div className="max-w-7xl mx-auto">{inner}</div>
    </div>
  );

  if (loading) {
    const loadingContent = <AnalyticsGridShimmer embedded={embedded} year={year} />;
    return embedded ? loadingContent : pageShell(loadingContent);
  }

  if (error) {
    const errorContent = (
      <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-6 text-center">
        <p className="text-red-600 analytics-error-text">{error}</p>
      </div>
    );
    return embedded ? errorContent : pageShell(errorContent);
  }

  return embedded ? content : pageShell(content);
}

export default Analytics;


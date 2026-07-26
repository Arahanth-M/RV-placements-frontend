import React from "react";
import { FaSync } from "react-icons/fa";

export default function DashboardRefreshButton({
  onClick,
  disabled = false,
  loading = false,
  label = "Refresh",
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex h-[38px] shrink-0 items-center gap-2 rounded-lg border border-theme bg-theme-hero px-3 text-xs font-semibold text-theme-secondary transition hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <FaSync className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
      {loading ? "Refreshing..." : label}
    </button>
  );
}

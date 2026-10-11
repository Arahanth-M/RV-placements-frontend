import { useCallback, useEffect, useState } from "react";
import { platformAdminAPI } from "../utils/api";

const inputClass =
  "w-full min-w-0 rounded-xl border-2 border-theme bg-theme-input px-3 py-2 text-sm text-theme-primary";

/**
 * Shown when Groq or Tavily reports a token or rate limit.
 * The admin can replace that key or change the completion token budget.
 */
export default function ResearchLimitRecovery({ secretId = "" }) {
  const [keys, setKeys] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [budgetDrafts, setBudgetDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await platformAdminAPI.getRuntimeSecrets();
      const nextKeys = Array.isArray(data?.keys) ? data.keys : [];
      const nextBudgets = Array.isArray(data?.budgets) ? data.budgets : [];
      setKeys(nextKeys);
      setBudgets(nextBudgets);
      setBudgetDrafts(
        Object.fromEntries(nextBudgets.map((row) => [row.id, String(row.value ?? "")]))
      );
    } catch (err) {
      setError(err?.response?.data?.error || "Keys could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const key = keys.find((row) => row.id === secretId) || null;
  const relatedBudgets = budgets.filter((row) => !secretId || row.secretId === secretId);

  const replaceKey = async () => {
    if (!key) return;
    const value = String(drafts[key.id] || "").trim();
    if (!value) {
      setError("Paste the full replacement key.");
      return;
    }
    setSaving(key.id);
    setError("");
    setNotice("");
    try {
      const { data } = await platformAdminAPI.updateRuntimeSecret(key.id, value);
      setKeys((current) => current.map((row) => (row.id === key.id ? data : row)));
      setDrafts((current) => ({ ...current, [key.id]: "" }));
      setNotice("Key replaced. Run the action again.");
    } catch (err) {
      setError(err?.response?.data?.error || "Key could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const saveBudget = async (id) => {
    const value = Number(budgetDrafts[id]);
    setSaving(id);
    setError("");
    setNotice("");
    try {
      const { data } = await platformAdminAPI.updateRuntimeBudget(id, value);
      setBudgets((current) => current.map((row) => (row.id === id ? data : row)));
      setBudgetDrafts((current) => ({ ...current, [id]: String(data?.value ?? value) }));
      setNotice("Token budget saved. The next run uses it.");
    } catch (err) {
      setError(err?.response?.data?.error || "Token budget could not be saved.");
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return <p className="mt-3 text-sm text-theme-secondary">Loading key and token settings…</p>;
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-red-500/40 bg-red-500/5 p-3">
      <p className="text-sm text-theme-primary">
        The provider token or rate limit was reached. Replace the key, or raise the token budget, then run it again.
      </p>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-500">{notice}</p> : null}
      {key ? (
        <div>
          <p className="text-xs font-semibold text-theme-primary">{key.label}</p>
          <p className="mt-1 font-mono text-xs text-theme-secondary">{key.hint || "Not set"}</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              className={`${inputClass} sm:flex-1`}
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={drafts[key.id] || ""}
              onChange={(event) =>
                setDrafts((current) => ({ ...current, [key.id]: event.target.value }))
              }
              aria-label={`Replacement for ${key.label}`}
              placeholder="Paste a new key"
            />
            <button
              type="button"
              disabled={saving === key.id}
              onClick={() => void replaceKey()}
              className="shrink-0 rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving === key.id ? "Saving…" : "Replace key"}
            </button>
          </div>
        </div>
      ) : null}
      {relatedBudgets.map((row) => (
        <div key={row.id} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-semibold text-theme-primary">
            {row.label}
            <input
              className={`${inputClass} mt-1`}
              type="number"
              min={row.min}
              max={row.max}
              value={budgetDrafts[row.id] ?? ""}
              onChange={(event) =>
                setBudgetDrafts((current) => ({ ...current, [row.id]: event.target.value }))
              }
              aria-label={`${row.label} token budget`}
            />
          </label>
          <button
            type="button"
            disabled={saving === row.id}
            onClick={() => void saveBudget(row.id)}
            className="shrink-0 rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-primary disabled:opacity-60"
          >
            {saving === row.id ? "Saving…" : "Save tokens"}
          </button>
        </div>
      ))}
    </div>
  );
}

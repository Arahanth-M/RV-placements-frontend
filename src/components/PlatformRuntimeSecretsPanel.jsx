import { useCallback, useEffect, useState } from "react";
import { platformAdminAPI } from "../utils/api";

const inputClass =
  "w-full min-w-0 rounded-xl border-2 border-theme bg-theme-input px-3 py-2 text-sm text-theme-primary";

function sourceLabel(source) {
  if (source === "override") return "Replacement in use";
  if (source === "env") return "Server default";
  return "Not set";
}

export default function PlatformRuntimeSecretsPanel() {
  const [keys, setKeys] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await platformAdminAPI.getRuntimeSecrets();
      setKeys(Array.isArray(data?.keys) ? data.keys : []);
    } catch (err) {
      setError(err?.response?.data?.error || "Keys could not be loaded.");
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const replaceKey = async (id) => {
    const value = String(drafts[id] || "").trim();
    if (!value) {
      setError("Paste the full replacement key.");
      return;
    }
    setSavingId(id);
    setError("");
    setNotice("");
    try {
      const { data } = await platformAdminAPI.updateRuntimeSecret(id, value);
      setKeys((current) => current.map((row) => (row.id === id ? data : row)));
      setDrafts((current) => ({ ...current, [id]: "" }));
      setNotice("Key updated. The next research call uses it.");
    } catch (err) {
      setError(err?.response?.data?.error || "Key could not be saved.");
    } finally {
      setSavingId("");
    }
  };

  const revertKey = async (id) => {
    setSavingId(id);
    setError("");
    setNotice("");
    try {
      const { data } = await platformAdminAPI.revertRuntimeSecret(id);
      setKeys((current) => current.map((row) => (row.id === id ? data : row)));
      setNotice("Server default restored.");
    } catch (err) {
      setError(err?.response?.data?.error || "Server default could not be restored.");
    } finally {
      setSavingId("");
    }
  };

  if (loading) {
    return <p className="text-sm text-theme-secondary">Loading keys…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-theme-primary">Research API keys</h3>
        <p className="mt-1 text-sm text-theme-secondary">
          Replace a Groq or Tavily key when it is used up. The full key stays on the server. This page shows only the last four characters.
        </p>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-500">{notice}</p> : null}
      <div className="space-y-3">
        {keys.map((row) => (
          <article key={row.id} className="rounded-2xl border border-theme bg-theme-card p-4 sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-theme-primary">{row.label}</h4>
                <p className="mt-1 text-xs text-theme-secondary">{row.description}</p>
              </div>
              <p className="shrink-0 text-xs font-medium text-theme-secondary">{sourceLabel(row.source)}</p>
            </div>
            <p className="mt-3 font-mono text-sm text-theme-primary">{row.hint || "Not set"}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                className={`${inputClass} sm:flex-1`}
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={drafts[row.id] || ""}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, [row.id]: event.target.value }))
                }
                aria-label={`Replacement for ${row.label}`}
                placeholder="Paste a new key"
              />
              <button
                type="button"
                disabled={savingId === row.id}
                onClick={() => void replaceKey(row.id)}
                className="shrink-0 rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingId === row.id ? "Saving…" : "Replace key"}
              </button>
            </div>
            {row.source === "override" ? (
              <button
                type="button"
                disabled={savingId === row.id}
                onClick={() => void revertKey(row.id)}
                className="mt-2 text-xs font-semibold text-theme-secondary underline disabled:opacity-60"
              >
                Use server default
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

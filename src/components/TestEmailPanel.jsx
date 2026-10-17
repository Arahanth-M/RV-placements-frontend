import { useCallback, useEffect, useState } from "react";
import { platformAdminAPI } from "../utils/api";
import ThemedSelect from "./ThemedSelect.jsx";
import { formatTestEmailExpiry } from "../utils/testEmailAccess.js";

const FALLBACK_DURATIONS = [2, 6, 8, 12, 24];

const inputClass =
  "w-full min-w-0 rounded-xl border-2 border-theme bg-theme-input px-3 py-2.5 text-sm text-theme-primary";

function statusClass(status) {
  if (status === "active") return "bg-emerald-500/15 text-emerald-600";
  if (status === "expired") return "bg-amber-500/15 text-amber-700";
  return "bg-red-500/10 text-red-600";
}

export default function TestEmailPanel() {
  const [emails, setEmails] = useState([]);
  const [durationOptions, setDurationOptions] = useState(FALLBACK_DURATIONS);
  const [email, setEmail] = useState("");
  const [durationHours, setDurationHours] = useState("6");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await platformAdminAPI.getTestEmails();
      const options = Array.isArray(data?.durationOptions) ? data.durationOptions : FALLBACK_DURATIONS;
      setDurationOptions(options);
      setEmails(Array.isArray(data?.emails) ? data.emails : []);
      setDurationHours((current) =>
        options.map(String).includes(String(current)) ? String(current) : String(options[0] || 6)
      );
    } catch (err) {
      setError(err?.response?.data?.error || "Test emails could not be loaded.");
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (event) => {
    event.preventDefault();
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail || !nextEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await platformAdminAPI.setTestEmail(nextEmail, Number(durationHours));
      setEmail("");
      setNotice(`${nextEmail} can sign in for ${durationHours} hours.`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || "Test email could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (target) => {
    setRevoking(target);
    setError("");
    setNotice("");
    try {
      await platformAdminAPI.revokeTestEmail(target);
      setNotice(`${target} can no longer sign in with test access.`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || "Test email could not be revoked.");
    } finally {
      setRevoking("");
    }
  };

  if (loading) {
    return <p className="text-sm text-theme-secondary">Loading test emails…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-theme-primary">Set test emailId</h3>
        <p className="mt-1 max-w-3xl text-sm text-theme-secondary">
          A test email can sign in for the window you choose and use the public platform once each:
          one AI mock interview, one PrepPath, one challenge submission, and one behavioural coach.
          In every company category only the first company opens in full. The other companies stay
          as cards. Setting the same email again only refreshes the sign-in window. It does not
          grant those features a second time.
        </p>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-500">{notice}</p> : null}

      <form
        onSubmit={save}
        className="rounded-2xl border border-theme bg-theme-card p-4 sm:p-5"
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(9rem,0.6fr)_auto] md:items-end">
          <label className="block text-sm font-semibold text-theme-primary">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@gmail.com"
              className={`${inputClass} mt-1.5`}
              autoComplete="off"
            />
          </label>
          <label className="block text-sm font-semibold text-theme-primary">
            Validity
            <div className="mt-1.5">
              <ThemedSelect
                ariaLabel="Test email validity"
                value={String(durationHours)}
                onChange={(value) => setDurationHours(String(value))}
                options={durationOptions.map((hours) => ({
                  value: String(hours),
                  label: `${hours} hours`,
                }))}
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-theme-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Set test emailId"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-theme bg-theme-card">
        {emails.length === 0 ? (
          <p className="p-4 text-sm text-theme-secondary">No test emails yet.</p>
        ) : (
          <ul className="divide-y divide-theme">
            {emails.map((row) => (
              <li
                key={row.id || row.email}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-theme-primary">{row.email}</p>
                  <p className="mt-1 text-xs text-theme-secondary">
                    {row.durationHours} hours · ends {formatTestEmailExpiry(row.expiresAt) || "—"}
                    {row.createdBy ? ` · set by ${row.createdBy}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(row.status)}`}
                  >
                    {row.status}
                  </span>
                  {row.status === "active" ? (
                    <button
                      type="button"
                      disabled={revoking === row.email}
                      onClick={() => revoke(row.email)}
                      className="rounded-xl border border-theme px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:text-red-600 disabled:opacity-50"
                    >
                      {revoking === row.email ? "Revoking…" : "Revoke"}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

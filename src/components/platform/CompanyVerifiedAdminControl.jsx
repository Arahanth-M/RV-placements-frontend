import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { FaCheck, FaStickyNote, FaTimes } from "react-icons/fa";
import { platformAdminAPI } from "../../utils/api";

/**
 * Platform-admin only: verification notes + mark company verified.
 * Notes are editable before and after verifying.
 */
export default function CompanyVerifiedAdminControl({
  company,
  onVerifiedChange,
  compact = false,
}) {
  const companyId = company?._id;
  const notesFieldId = useId();
  const [verified, setVerified] = useState(company?.verified === true);
  const [notes, setNotes] = useState(String(company?.verifiedNotes || ""));
  const [draftNotes, setDraftNotes] = useState(String(company?.verifiedNotes || ""));
  const [panelOpen, setPanelOpen] = useState(!compact);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setVerified(company?.verified === true);
    const nextNotes = String(company?.verifiedNotes || "");
    setNotes(nextNotes);
    setDraftNotes(nextNotes);
  }, [company?._id, company?.verified, company?.verifiedNotes]);

  if (!companyId) return null;

  const notesDirty = draftNotes.trim() !== String(notes || "").trim();

  const persist = async ({ nextVerified, nextNotes } = {}) => {
    if (saving) return;
    const body = {};
    if (typeof nextVerified === "boolean") body.verified = nextVerified;
    if (nextNotes !== undefined) body.notes = nextNotes;
    if (body.verified === undefined && body.notes === undefined) return;

    setSaving(true);
    setError("");
    try {
      const { data } = await platformAdminAPI.setCompanyVerified(companyId, body);
      const savedVerified = data?.verified === true;
      const savedNotes = String(data?.verifiedNotes || "");
      setVerified(savedVerified);
      setNotes(savedNotes);
      setDraftNotes(savedNotes);
      onVerifiedChange?.({
        verified: savedVerified,
        verifiedAt: data?.verifiedAt || null,
        verifiedNotes: savedNotes,
      });
      if (compact && typeof nextVerified === "boolean") {
        setPanelOpen(false);
      }
    } catch (err) {
      setError(
        err?.response?.data?.error || err?.message || "Could not update verification"
      );
    } finally {
      setSaving(false);
    }
  };

  const openPanel = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setDraftNotes(notes);
    setError("");
    setPanelOpen(true);
  };

  const closePanel = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setDraftNotes(notes);
    setError("");
    if (compact) setPanelOpen(false);
  };

  const notesEditor = (
    <div
      className="space-y-2"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <label
        htmlFor={notesFieldId}
        className="block text-[11px] font-semibold uppercase tracking-wide text-theme-secondary"
      >
        Verification notes
      </label>
      <textarea
        id={notesFieldId}
        value={draftNotes}
        onChange={(event) => setDraftNotes(event.target.value)}
        rows={compact ? 4 : 3}
        maxLength={2000}
        disabled={saving}
        placeholder="Add review notes before verifying (editable anytime)…"
        className="w-full resize-y rounded-xl border border-theme-input bg-theme-input px-3 py-2 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={saving || !notesDirty}
          onClick={() => void persist({ nextNotes: draftNotes })}
          className="rounded-lg border border-theme bg-theme-card px-3 py-1.5 text-xs font-semibold text-theme-secondary transition hover:bg-theme-hero disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save notes"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            void persist({
              nextVerified: !verified,
              nextNotes: draftNotes,
            })
          }
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
            verified
              ? "border border-theme bg-theme-card text-theme-secondary hover:bg-theme-hero"
              : "bg-theme-accent text-white hover:opacity-95"
          }`}
        >
          {saving
            ? "Saving…"
            : verified
              ? "Unverify"
              : "Mark verified"}
        </button>
        {compact ? (
          <button
            type="button"
            disabled={saving}
            onClick={closePanel}
            className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-hero disabled:opacity-50"
          >
            Close
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-[11px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );

  const statusButton = (
    <button
      type="button"
      onClick={openPanel}
      disabled={saving && !compact}
      aria-pressed={verified}
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wide transition-colors disabled:opacity-60 ${
        verified
          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : "border-theme bg-theme-card/95 text-theme-secondary hover:bg-theme-hero"
      } ${
        compact
          ? "px-2 py-0.5 text-[10px] shadow-sm"
          : "gap-2 rounded-xl px-3 py-1.5 text-xs"
      }`}
      title={
        verified
          ? "Verified — open to edit notes or unverify"
          : "Add notes and mark this company verified"
      }
    >
      {verified ? (
        <FaCheck className="h-3 w-3 shrink-0" aria-hidden />
      ) : (
        <FaStickyNote className="h-3 w-3 shrink-0" aria-hidden />
      )}
      {verified ? "Verified" : compact ? "Verify…" : "Verify company"}
      {!verified && notes.trim() ? (
        <span className="normal-case tracking-normal font-semibold opacity-80">
          · notes
        </span>
      ) : null}
    </button>
  );

  if (!compact) {
    return (
      <div className="mt-3 space-y-2" data-testid="company-verified-admin-control">
        <div className="flex flex-wrap items-center gap-2">{statusButton}</div>
        {notesEditor}
      </div>
    );
  }

  return (
    <div data-testid="company-verified-admin-control">
      {statusButton}
      {panelOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center"
              role="dialog"
              aria-modal="true"
              aria-label="Company verification notes"
              onClick={closePanel}
            >
              <div
                className="w-full max-w-md rounded-2xl border border-theme bg-theme-card p-4 shadow-2xl sm:p-5"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-theme-primary">
                      {company?.name || "Company"} verification
                    </p>
                    <p className="mt-0.5 text-xs text-theme-secondary">
                      Add notes first, then mark verified. Notes stay editable.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="rounded-lg border border-theme p-2 text-theme-secondary hover:bg-theme-hero"
                    aria-label="Close"
                  >
                    <FaTimes className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                {notesEditor}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

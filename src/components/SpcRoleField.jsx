import { useEffect, useState } from "react";
import { spcAPI } from "../utils/api";

const INPUT_CLASS =
  "spc-field-control h-11 min-h-[2.75rem] max-h-[2.75rem] w-full shrink-0 rounded-xl border border-theme-input bg-theme-input px-4 text-sm text-theme-primary outline-none focus:border-theme-accent transition-colors placeholder:text-theme-muted box-border";

/**
 * Single role field: pick from visit roles (datalist) or type a custom name — no separate "Other" step.
 */
export default function SpcRoleField({
  companyId,
  placementYear,
  placementContext = "",
  branchCode = "",
  value,
  onChange,
  inputId = "spc-role",
  label = "Role",
  required = true,
}) {
  const [roleOptions, setRoleOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const listId = `${inputId}-options`;

  useEffect(() => {
    const branch = String(branchCode || "").trim();
    if (!companyId || !branch) {
      setRoleOptions([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await spcAPI.getCompanyRoles({
          companyId,
          placementYear,
          placementContext: placementContext || undefined,
          branchCode: String(branchCode || "").trim() || undefined,
        });
        const roles = Array.isArray(res?.data?.roles) ? res.data.roles : [];
        if (!cancelled) setRoleOptions(roles);
      } catch {
        if (!cancelled) setRoleOptions(["TBD"]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId, placementYear, placementContext, branchCode]);

  const branchSelected = Boolean(String(branchCode || "").trim());
  const hasSuggestions = Boolean(companyId && branchSelected && roleOptions.length > 0 && !loading);

  return (
    <div className="flex min-h-0 w-full flex-col gap-2 self-start sm:col-span-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-theme-primary">
        {label}
        {required ? <span className="text-theme-accent"> *</span> : null}
      </label>

      <input
        id={inputId}
        type="text"
        name="role"
        value={value}
        onChange={onChange}
        onInput={onChange}
        list={hasSuggestions ? listId : undefined}
        autoComplete="off"
        placeholder={
          loading
            ? "Loading roles…"
            : !branchSelected && companyId
              ? "Select branch first"
              : hasSuggestions
                ? "Pick from suggestions or type a role"
                : companyId
                  ? "Enter role name"
                  : "e.g. Analyst, SDE"
        }
        className={INPUT_CLASS}
        required={required}
        disabled={Boolean(companyId && (!branchSelected || loading))}
      />

      {hasSuggestions ? (
        <datalist id={listId}>
          {roleOptions.map((roleName) => (
            <option key={roleName} value={roleName} />
          ))}
        </datalist>
      ) : null}

      {companyId && branchSelected && !loading ? (
        <p className="text-xs text-theme-muted">
          Roles from this company&apos;s{" "}
          <span className="font-medium text-theme-secondary">
            {String(branchCode).trim().toUpperCase()}
          </span>{" "}
          hub visit ({placementYear}). If the role is not known yet, pick{" "}
          <span className="font-medium text-theme-secondary">TBD</span>.
          {hasSuggestions && roleOptions.length > 1
            ? " You can type a role not listed."
            : null}
        </p>
      ) : null}
      {companyId && !branchSelected ? (
        <p className="text-xs text-theme-muted">Select a branch to load roles for that hub.</p>
      ) : null}
    </div>
  );
}

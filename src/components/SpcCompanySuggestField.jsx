import { getSpcCompanyListHint } from "../utils/spcFormValidation.js";
import { INPUT_CLASS } from "./SpcFormField.jsx";

/**
 * Company autocomplete — submit only when a list item is picked (not free-typed names).
 */
export default function SpcCompanySuggestField({
  inputId,
  label = "Company",
  /** Controlled value for the search input */
  companyQuery,
  /** `name` on the input — must match the parent `onChange` handler (default `companyQuery`) */
  fieldName = "companyQuery",
  selectedCompany,
  suggestions,
  suggestOpen,
  suggestLoading,
  suggestRootRef,
  onQueryChange,
  onPickCompany,
  onFocusOpen,
}) {
  const hint = getSpcCompanyListHint(companyQuery, selectedCompany, {
    suggestLoading,
    suggestions,
  });

  const hintClass =
    hint.type === "missing"
      ? "text-indigo-600 dark:text-indigo-400"
      : hint.type === "linked"
        ? "text-theme-secondary"
        : "text-theme-muted";

  return (
    <div ref={suggestRootRef} className="relative flex min-h-0 w-full flex-col gap-2 self-start">
      <label htmlFor={inputId} className="block text-sm font-medium text-theme-primary">
        {label} <span className="text-theme-accent">*</span>
      </label>
      <input
        id={inputId}
        name={fieldName}
        autoComplete="off"
        value={companyQuery}
        onChange={onQueryChange}
        onFocus={onFocusOpen}
        placeholder="Search and pick from the list only"
        className={INPUT_CLASS}
        aria-invalid={hint.type === "missing" || hint.type === "pick"}
      />
      {hint.message ? (
        <p className={`text-xs ${hintClass}`} role={hint.type === "missing" ? "alert" : "status"}>
          {hint.message}
        </p>
      ) : null}
      {suggestOpen && suggestions.length > 0 ? (
        <ul
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-xl border border-theme bg-theme-card py-1 shadow-lg"
          role="listbox"
        >
          {suggestions.map((item) => (
            <li key={item.id} role="presentation">
              <button
                type="button"
                className="flex w-full px-4 py-2.5 text-left text-sm text-theme-primary hover:bg-theme-nav"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => onPickCompany(item)}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

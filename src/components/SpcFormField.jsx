const INPUT_CLASS =
  "spc-field-control h-11 min-h-[2.75rem] max-h-[2.75rem] w-full shrink-0 rounded-xl border border-theme-input bg-theme-input px-4 text-sm text-theme-primary outline-none focus:border-theme-accent transition-colors placeholder:text-theme-muted box-border";

/** Text field with optional required marker and hint (e.g. TBD note for compensation). */
export default function SpcFormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  hint = "",
  idPrefix = "spc",
}) {
  const inputId = `${idPrefix}-field-${name}`;
  return (
    <div className="flex min-h-0 w-full flex-col gap-2 self-start">
      <label htmlFor={inputId} className="block text-sm font-medium text-theme-primary">
        {label}
        {required ? <span className="text-theme-accent"> *</span> : null}
      </label>
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={INPUT_CLASS}
      />
      {hint ? <p className="text-xs text-theme-muted">{hint}</p> : null}
    </div>
  );
}

export { INPUT_CLASS };

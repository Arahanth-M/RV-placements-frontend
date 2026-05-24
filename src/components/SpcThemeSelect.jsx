import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaChevronDown } from "react-icons/fa";
import { INPUT_CLASS } from "./SpcFormField.jsx";

const FLOATING_LIST_Z = 10000;

/**
 * Theme-aware dropdown: trigger + list both use `bg-theme-*`, `border-theme-input`, etc.
 * Use this instead of native `<select>` so Safari/Chrome show the same open panel in light/dark.
 * The panel is rendered in `document.body` with fixed positioning so it is not clipped by
 * `overflow-auto` shells (for example SPC edit modals).
 *
 * @param {{ id?: string, name: string, value: string|number, onChange: (e: { target: { name: string, value: unknown } }) => void,
 *   options: Array<{ value: string|number, label: string }>, placeholder?: string, labelId?: string,
 *   required?: boolean, disabled?: boolean }} props
 */
export default function SpcThemeSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "",
  labelId,
  required = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const listboxId = useId();
  /** @type {[null | { top: number; left: number; width: number }, (p: null | { top: number; left: number; width: number }) => void]} */
  const [panelRect, setPanelRect] = useState(null);

  const measurePanel = () => {
    const el = triggerRef.current;
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    const gap = 4;
    setPanelRect({ top: r.bottom + gap, left: r.left, width: r.width });
  };

  useLayoutEffect(() => {
    if (!open || disabled) {
      setPanelRect(null);
      return;
    }
    measurePanel();
  }, [open, disabled]);

  useEffect(() => {
    if (!open || disabled) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onPointerDown = (e) => {
      const target = e.target instanceof Node ? e.target : null;
      if (
        target &&
        (rootRef.current?.contains(target) || panelRef.current?.contains(target))
      ) {
        return;
      }
      setOpen(false);
    };

    const onScrollOrResize = () => measurePanel();

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onScrollOrResize);
    document.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, disabled]);

  const stringValue = value === undefined || value === null ? "" : String(value);
  const selectedOption = options.find((o) => String(o.value) === stringValue);
  const displayText =
    selectedOption?.label ?? (placeholder || "");
  const muted = stringValue === "" || !selectedOption;

  const pick = (opt) => {
    if (disabled) return;
    onChange({ target: { name, value: opt.value } });
    setOpen(false);
  };

  const listbox =
    open && !disabled && panelRect && typeof document !== "undefined"
      ? createPortal(
          <ul
            ref={panelRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            className="max-h-[min(15rem,45vh)] overflow-auto rounded-xl border border-theme-input bg-theme-card py-1 shadow-[var(--shadow-soft)]"
            style={{
              position: "fixed",
              top: panelRect.top,
              left: panelRect.left,
              width: panelRect.width,
              zIndex: FLOATING_LIST_Z,
            }}
          >
            {options.map((opt) => {
              const selected = String(opt.value) === stringValue;
              return (
                <li key={`${String(opt.value)}-${opt.label}`} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`flex w-full px-4 py-2.5 text-left text-sm transition-colors ${
                      selected
                        ? "bg-theme-nav font-medium text-theme-primary"
                        : "text-theme-primary hover:bg-theme-nav"
                    }`}
                    onClick={() => pick(opt)}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-labelledby={labelId}
        aria-required={required || undefined}
        className={`${INPUT_CLASS} flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50`}
        onClick={() => !disabled && setOpen((p) => !p)}
      >
        <span className={muted ? "text-theme-muted" : "text-theme-primary"}>
          {displayText}
        </span>
        <FaChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-theme-secondary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {listbox}
    </div>
  );
}

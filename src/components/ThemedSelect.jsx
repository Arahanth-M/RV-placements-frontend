import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Border-only hover (cluster-card style); plan-setup-control blocks global card lift. */
const PLAN_PICKER_TRIGGER_CLASS =
  "plan-setup-control w-full min-w-0 rounded-xl border-2 border-theme bg-theme-input px-3 py-2.5 text-sm text-theme-primary text-left flex items-center justify-between gap-2 focus:outline-none focus:border-theme-accent hover:border-theme-accent";

const PLAN_PICKER_MENU_CLASS =
  "plan-setup-menu max-h-56 overflow-auto rounded-xl border-2 border-theme bg-theme-card shadow-lg py-1.5 px-1.5 space-y-1";

const planPickerOptionClass = ({ isActive, isHovered }) =>
  [
    "plan-setup-option w-full text-left text-sm rounded-lg border-2",
    isActive
      ? "border-theme-accent text-theme-primary font-medium"
      : isHovered
        ? "border-theme-accent text-theme-primary"
        : "border-transparent text-theme-secondary hover:border-theme-accent hover:text-theme-primary",
  ].join(" ");

export default function ThemedSelect({
  value,
  options,
  onChange,
  placeholder = "Select option",
  ariaLabel,
  disabled = false,
  triggerClassName = "",
  menuClassName = "",
  /** Use card surface on triggers sitting on bg-theme-input rows. */
  triggerSurface = "input",
}) {
  const [open, setOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const listboxId = useId();
  const [panelRect, setPanelRect] = useState(null);

  const measurePanel = () => {
    const el = triggerRef.current;
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    setPanelRect({ top: r.bottom + 8, left: r.left, width: r.width });
  };

  useLayoutEffect(() => {
    if (!open || disabled) {
      setPanelRect(null);
      return;
    }
    measurePanel();
  }, [open, disabled]);

  useEffect(() => {
    const onDocPointer = (event) => {
      const target = event.target instanceof Node ? event.target : null;
      if (!target) return;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocPointer);
    return () => document.removeEventListener("mousedown", onDocPointer);
  }, []);

  useEffect(() => {
    if (!open || disabled) return undefined;

    const onScrollOrResize = () => measurePanel();
    window.addEventListener("resize", onScrollOrResize);
    document.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, disabled]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const active = options.find((item) => String(item.value) === String(value)) || null;

  const triggerSurfaceClass =
    triggerSurface === "card" ? "bg-theme-card hover:bg-theme-card" : "";

  const menu =
    open && !disabled && panelRect && typeof document !== "undefined"
      ? createPortal(
          <ul
            ref={panelRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            className={`${PLAN_PICKER_MENU_CLASS} ${menuClassName}`.trim()}
            style={{
              position: "fixed",
              top: panelRect.top,
              left: panelRect.left,
              width: panelRect.width,
              zIndex: 10050,
            }}
          >
            {options.map((item) => {
              const isActive = String(item.value) === String(value);
              const isHovered = String(item.value) === String(hoveredValue);
              return (
                <li
                  key={`${ariaLabel || "select"}-${item.value}`}
                  role="option"
                  aria-selected={isActive}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setHoveredValue(item.value)}
                    onMouseLeave={() => setHoveredValue(null)}
                    onClick={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className={`px-3 py-2.5 ${planPickerOptionClass({ isActive, isHovered })}`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={`${PLAN_PICKER_TRIGGER_CLASS} ${triggerSurfaceClass} ${triggerClassName} ${
          disabled ? "opacity-60 cursor-not-allowed hover:border-theme" : ""
        }`.trim()}
      >
        <span className="truncate">{active?.label || placeholder}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-theme-accent transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {menu}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { useAuth } from "../utils/AuthContext";
import { LOGIN_INTENT_CAMPUS, LOGIN_INTENT_GENERAL } from "../utils/loginIntent.js";

const OPTIONS = [
  {
    intent: LOGIN_INTENT_GENERAL,
    title: "General dashboard",
    subtitle: "My college is not on the platform yet",
  },
  {
    intent: LOGIN_INTENT_CAMPUS,
    title: "Campus dashboard",
    subtitle: "My college is already onboarded",
  },
];

export default function PlatformLoginMenu({
  triggerClassName,
  triggerLabel = "Login",
  disabled = false,
  align = "right",
}) {
  const { login } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (intent) => {
    setOpen(false);
    login(false, { intent });
  };

  const menuAlignClass =
    align === "center"
      ? "left-1/2 -translate-x-1/2"
      : align === "left"
        ? "left-0"
        : "right-0";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {triggerLabel}
        <FaChevronDown
          className={`h-3 w-3 shrink-0 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute z-50 mt-2 w-[min(20.5rem,calc(100vw-2rem))] rounded-2xl border border-theme bg-theme-card p-1.5 shadow-2xl ${menuAlignClass}`}
        >
          {OPTIONS.map((option) => (
            <button
              key={option.intent}
              type="button"
              role="menuitem"
              onClick={() => pick(option.intent)}
              className="login-menu-option"
            >
              <span className="login-menu-option-title">{option.title}</span>
              <span className="login-menu-option-sub">{option.subtitle}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

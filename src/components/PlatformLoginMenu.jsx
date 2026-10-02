import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaChevronDown } from "react-icons/fa";
import { useAuth } from "../utils/AuthContext";
import { LOGIN_INTENT_CAMPUS, LOGIN_INTENT_GENERAL, LOGIN_INTENT_PLATFORM_ADMIN } from "../utils/loginIntent.js";

const OPTIONS = [
  {
    intent: LOGIN_INTENT_GENERAL,
    title: "General dashboard",
    description:
      "Choose this if your college has not been onboarded. You will sign in to the shared general dashboard for company prep, mock interviews, resume tools, and resources that are not tied to a specific campus.",
    admin: false,
  },
  {
    intent: LOGIN_INTENT_CAMPUS,
    title: "Campus dashboard",
    description:
      "Choose this if your college is already on the platform. Sign in with your official college email to open your campus dashboard, including college-specific placement data and drives.",
    admin: false,
  },
  {
    intent: LOGIN_INTENT_PLATFORM_ADMIN,
    title: "Platform admin",
    description:
      "This is the owner console for the general dashboard and every onboarded campus. Continue only if you have a platform owner account.",
    admin: true,
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
  const [selected, setSelected] = useState(null);
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

  useEffect(() => {
    if (!selected) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelected(null);
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  const chooseOption = (option) => {
    setOpen(false);
    setSelected(option);
  };

  const goBackToMenu = () => {
    setSelected(null);
    setOpen(true);
  };

  const continueToLogin = () => {
    if (!selected) return;
    const option = selected;
    setSelected(null);
    login(option.admin === true, { intent: option.intent });
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
              aria-haspopup="dialog"
              onClick={() => chooseOption(option)}
              className="login-menu-option"
            >
              <span className="login-menu-option-title">{option.title}</span>
            </button>
          ))}
        </div>
      ) : null}
      {selected
        ? createPortal(
            <div
              className="login-intent-backdrop fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="login-intent-title"
              aria-describedby="login-intent-description"
              onClick={goBackToMenu}
            >
              <div
                className="w-full max-w-md rounded-2xl border border-theme bg-theme-card shadow-[var(--shadow-soft)] p-6 sm:p-7 flex flex-col gap-5"
                onClick={(event) => event.stopPropagation()}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-theme-accent mb-2">
                    Sign-in method
                  </p>
                  <h2
                    id="login-intent-title"
                    className="text-xl sm:text-2xl font-bold text-theme-primary leading-tight"
                  >
                    {selected.title}
                  </h2>
                </div>
                <p
                  id="login-intent-description"
                  className="text-sm sm:text-base text-theme-secondary leading-relaxed"
                >
                  {selected.description}
                </p>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-theme">
                  <button
                    type="button"
                    onClick={goBackToMenu}
                    className="px-6 py-3 rounded-xl border border-theme text-theme-primary text-sm sm:text-base font-semibold transition-colors hover:bg-theme-hero"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={continueToLogin}
                    className="px-6 py-3 rounded-xl bg-theme-accent text-white text-sm sm:text-base font-semibold shadow-lg transition-colors hover:opacity-95"
                  >
                    Continue to login
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

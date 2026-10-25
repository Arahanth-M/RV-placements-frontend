import { Link } from "react-router-dom";
import { FaChevronRight, FaGraduationCap, FaLock } from "react-icons/fa";

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function SignInPanel({ onCollege, onGeneral }) {
  return (
    <div className="w-full text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-theme-accent text-white shadow-lg shadow-indigo-500/25">
        <FaGraduationCap className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-theme-primary">Welcome back</h2>
      <p className="mt-1 text-sm text-theme-secondary">Choose how you want to sign in</p>

      <button
        type="button"
        onClick={onCollege}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-theme-accent px-3.5 py-3 text-left text-white shadow-md transition hover:opacity-95"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
          <GoogleMark />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-tight">Campus dashboard</span>
          <span className="mt-0.5 block text-xs font-normal text-white/80">
            Use your college email
          </span>
        </span>
        <FaChevronRight className="h-3.5 w-3.5 shrink-0 text-white/80" aria-hidden />
      </button>

      <div className="my-3 flex items-center gap-3 text-xs text-theme-secondary">
        <span className="h-px flex-1 border-t border-theme" />
        or
        <span className="h-px flex-1 border-t border-theme" />
      </div>

      <button
        type="button"
        onClick={onGeneral}
        className="flex w-full items-center gap-3 rounded-2xl border border-theme bg-theme-card px-3.5 py-3 text-left text-theme-primary transition hover:bg-theme-hero"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-theme-hero">
          <GoogleMark />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-tight">General dashboard</span>
          <span className="mt-0.5 block text-xs font-normal text-theme-secondary">
            Use your personal email
          </span>
        </span>
        <FaChevronRight className="h-3.5 w-3.5 shrink-0 text-theme-secondary" aria-hidden />
      </button>

      <p className="mt-3 text-xs leading-relaxed text-theme-secondary">
        Not sure your college is onboarded?{" "}
        <button
          type="button"
          onClick={onGeneral}
          className="font-semibold text-theme-accent underline underline-offset-2"
        >
          Sign in with your college email to check
        </button>
      </p>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-theme-secondary">
        <FaLock className="h-3 w-3" aria-hidden />
        We only access your name and email
      </p>
      <p className="mt-1.5 text-xs text-theme-secondary">
        <Link to="/terms" className="underline underline-offset-2 hover:text-theme-accent">
          Terms
        </Link>
        <span className="mx-1.5">·</span>
        <Link to="/privacy" className="underline underline-offset-2 hover:text-theme-accent">
          Privacy
        </Link>
      </p>
    </div>
  );
}

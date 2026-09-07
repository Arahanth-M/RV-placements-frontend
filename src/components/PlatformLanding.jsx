import { Link } from "react-router-dom";
import { TENANT_BASE } from "../constants/tenant.js";

/** Public product home. College dashboard lives under /rvce. */
export default function PlatformLanding() {
  return (
    <div className="flex min-h-screen flex-col bg-theme-app text-theme-primary">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-theme-accent">
          Last Minute Placement Prep
        </p>
        <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
          Placement prep for your campus
        </h1>
        <p className="mt-4 max-w-xl text-base text-theme-secondary sm:text-lg">
          Company insights, interview experiences, resources, and AI mock
          interviews — one dashboard per institution.
        </p>
        <Link
          to={TENANT_BASE}
          className="mt-10 rounded-xl bg-theme-accent px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90 sm:text-base"
        >
          Enter RVCE dashboard
        </Link>
      </main>
    </div>
  );
}

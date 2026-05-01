import { useNavigate } from "react-router-dom";

export default function SPCDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-3xl border border-theme bg-theme-card p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-theme-primary">SPC Dashboard</h1>
        <p className="mt-3 text-sm text-theme-secondary">
          Manage SPC placement workflows from here.
        </p>
        <div className="mt-8">
          <button
            type="button"
            onClick={() => navigate("/spc/form")}
            className="rounded-xl bg-theme-accent px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Add Placement Data
          </button>
        </div>
      </div>
    </div>
  );
}

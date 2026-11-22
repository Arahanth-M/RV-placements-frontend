/**
 * Full-viewport auth/route loading placeholder.
 * Replaces plain "Loading..." text during session checks and OAuth handoff.
 */
export default function AuthLoadingShimmer() {
  return (
    <div className="min-h-screen bg-theme-app" aria-busy="true" aria-label="Loading">
      <div className="w-full py-6 sm:py-10 md:py-14 px-4 sm:px-6 bg-theme-hero">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-1 w-full space-y-4">
              <div className="shimmer-box h-12 sm:h-14 md:h-16 w-full rounded-xl" />
              <div className="shimmer-box h-6 sm:h-7 w-[92%] rounded-lg" />
              <div className="shimmer-box h-6 sm:h-7 w-[85%] rounded-lg" />
            </div>
            <div className="flex-1 w-full">
              <div
                className="shimmer-box w-full rounded-xl"
                style={{ minHeight: "300px", maxHeight: "70vh" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="bg-theme-card border-2 border-theme-accent rounded-2xl p-6 sm:p-8 space-y-3"
            >
              <div className="shimmer-box h-10 w-10 rounded-full" />
              <div className="shimmer-box h-5 w-3/4 rounded-md" />
              <div className="shimmer-box h-4 w-full rounded-md" />
              <div className="shimmer-box h-4 w-[90%] rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

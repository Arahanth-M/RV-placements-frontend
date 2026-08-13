import { spcClusterLabel } from "../utils/spcCluster.js";

export default function SpcClusterNotice({ cluster }) {
  if (cluster) {
    return (
      <p className="mt-2 text-sm text-theme-secondary">
        You can only work with the <span className="font-medium text-theme-primary">{spcClusterLabel(cluster)}</span> cluster.
      </p>
    );
  }
  return (
    <div
      className="mt-4 rounded-xl border border-amber-300/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-200"
      role="status"
    >
      Your SPC cluster is not assigned yet. Ask an admin to assign a cluster before reviewing contributions or adding placement data.
    </div>
  );
}

/** Recharts bar colors for department average CTC tiers. */
export function deptAvgCtcColor(avgCtc) {
  if (avgCtc >= 17) return "#185FA5";
  if (avgCtc >= 12) return "#378ADD";
  if (avgCtc >= 9) return "#7BB8E8";
  return "#B5D4F4";
}

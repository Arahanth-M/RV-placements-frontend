/** Static 2026 placement statistics — sourced from 2026_Placement_Statistics.xlsx */

export const PLACEMENT_STATS_2026 = {
  year: 2026,
  totalOffers: 850,

  kpis: {
    totalOffers: 850,
    companiesRecruited: 197,
    highestCtc: { value: "₹67L", note: "Arcesium & Confluent" },
    averageCtc: { value: "₹15.1L", note: "Median ₹12L" },
    ppoOffers: { value: 94, note: "11% of total offers" },
    campusPlacements: { value: 756, note: "89% of total offers" },
    offersAbove30L: { value: 52, note: "6.1% of total offers" },
  },

  byDepartment: [
    { department: "CSE", offers: 208 },
    { department: "ECE", offers: 124 },
    { department: "ISE", offers: 78 },
    { department: "ME", offers: 71 },
    { department: "CS-DS", offers: 54 },
    { department: "AI/ML", offers: 54 },
    { department: "CS-CYB", offers: 51 },
    { department: "IEM", offers: 41 },
    { department: "ETE", offers: 37 },
    { department: "Civil", offers: 32 },
    { department: "EEE", offers: 28 },
    { department: "EIE", offers: 25 },
    { department: "ASE", offers: 21 },
    { department: "BT", offers: 13 },
    { department: "CH", offers: 13 },
  ],

  ctcDistribution: [
    { range: "< ₹10L", offers: 216, color: "#B5D4F4" },
    { range: "₹10–20L", offers: 427, color: "#378ADD" },
    { range: "₹20–30L", offers: 153, color: "#185FA5" },
    { range: "₹30–50L", offers: 36, color: "#BA7517" },
    { range: "> ₹50L", offers: 16, color: "#534AB7" },
  ],

  topCompanies: [
    { company: "Oracle / OFSS", offers: 26 },
    { company: "Honeywell", offers: 22 },
    { company: "SAP", offers: 16 },
    { company: "HSBC", offers: 16 },
    { company: "Societe Generale", offers: 14 },
    { company: "Boeing (PPO)", offers: 13 },
    { company: "HPE (PPO)", offers: 13 },
    { company: "Genpact", offers: 13 },
    { company: "Deutsche Bank", offers: 12 },
    { company: "Qualcomm", offers: 12 },
    { company: "Honda M&S", offers: 12 },
    { company: "Molex/Koch", offers: 12 },
  ],

  monthlyTimeline: [
    { month: "May–Aug (PPO)", chartLabel: "PPO", offers: 94, variant: "ppo" },
    { month: "Aug", chartLabel: "Aug", offers: 78, variant: "default" },
    { month: "Sept", chartLabel: "Sept", offers: 262, variant: "default" },
    { month: "Oct", chartLabel: "Oct", offers: 79, variant: "default" },
    { month: "Nov", chartLabel: "Nov", offers: 77, variant: "default" },
    { month: "Nov–Dec", chartLabel: "N–Dec", offers: 14, variant: "default" },
    { month: "Dec", chartLabel: "Dec", offers: 94, variant: "default" },
    { month: "Jan", chartLabel: "Jan", offers: 67, variant: "default" },
    { month: "Feb", chartLabel: "Feb", offers: 41, variant: "default" },
    { month: "Mar", chartLabel: "Mar", offers: 15, variant: "late" },
    { month: "Apr", chartLabel: "Apr", offers: 29, variant: "late" },
  ],

  /** Offer-weighted average CTC per department (₹L). */
  departmentAvgCtc: [
    { department: "CSE", avgCtc: 21.1, offers: 208 },
    { department: "ISE", avgCtc: 18.4, offers: 78 },
    { department: "AI/ML", avgCtc: 17.7, offers: 54 },
    { department: "CS-CYB", avgCtc: 17.1, offers: 51 },
    { department: "CS-DS", avgCtc: 17.0, offers: 54 },
    { department: "ECE", avgCtc: 15.3, offers: 124 },
    { department: "ETE", avgCtc: 13.6, offers: 37 },
    { department: "EEE", avgCtc: 10.3, offers: 28 },
    { department: "EIE", avgCtc: 10.3, offers: 25 },
    { department: "IEM", avgCtc: 9.6, offers: 41 },
    { department: "ME", avgCtc: 9.3, offers: 71 },
    { department: "CH", avgCtc: 8.4, offers: 13 },
    { department: "BT", avgCtc: 8.2, offers: 13 },
    { department: "ASE", avgCtc: 8.1, offers: 21 },
    { department: "Civil", avgCtc: 6.8, offers: 32 },
  ],
};

export function deptAvgCtcColor(avgCtc) {
  if (avgCtc >= 17) return "#185FA5";
  if (avgCtc >= 12) return "#378ADD";
  if (avgCtc >= 9) return "#7BB8E8";
  return "#B5D4F4";
}

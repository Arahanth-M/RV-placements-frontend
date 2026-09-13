import { useLocation } from "react-router-dom";
import { GENERAL_BASE } from "../../constants/tenant.js";

export const LEGAL_LAST_UPDATED = "13 September 2026";

export const LEGAL_BRAND = "Last Minute Placement Prep";
export const LEGAL_OPERATOR = "Devomation AI";
export const LEGAL_WEBSITE = "https://lastminuteplacementprep.in";
export const LEGAL_LOCATION = "Bengaluru, Karnataka, India";

export const PUBLIC_LEGAL_PATHS = [
  { label: "About Us", path: "/about" },
  { label: "Pricing", path: "/pricing" },
  { label: "Contact Us", path: "/contact" },
  { label: "Terms & Conditions", path: "/terms" },
  { label: "Privacy Policy", path: "/privacy" },
  { label: "Cancellation & Refunds", path: "/refund" },
  { label: "Shipping Policy", path: "/shipping" },
];

export const GENERAL_LEGAL_PATHS = PUBLIC_LEGAL_PATHS;

/** Keep policy links on the same surface (public site vs /general). */
export function useLegalPath() {
  const { pathname } = useLocation();
  const prefix = String(pathname || "").startsWith(GENERAL_BASE) ? GENERAL_BASE : "";
  return (path) => {
    const p = String(path || "").startsWith("/") ? path : `/${path}`;
    return `${prefix}${p}`;
  };
}

export const PUBLIC_PLAN_PRICES = [
  {
    name: "Free trial",
    price: "₹0",
    detail: "First company in each category, 1 AI mock interview, and 1 PrepPath plan.",
  },
  {
    name: "Unlock one category",
    price: "₹299",
    detail: "Full company-card details for one category. One-time, 6 months. No auto-renew.",
  },
  {
    name: "Unlock all company cards",
    price: "₹499",
    detail: "Full details for every company card. One-time, 6 months. No auto-renew.",
  },
  {
    name: "Unlimited AI mock interviews",
    price: "₹399",
    detail: "Unlimited AI mocks on companies you can open. One-time, 6 months. No auto-renew.",
  },
  {
    name: "Unlock PrepPath",
    price: "₹299",
    detail: "Unlimited PrepPath plans on companies you can open. One-time, 6 months. No auto-renew.",
  },
  {
    name: "AI mocks + PrepPath",
    price: "₹499",
    detail: "Unlimited AI mocks and PrepPath. One-time, 6 months. No auto-renew.",
  },
  {
    name: "All premium features",
    price: "₹699",
    detail: "All company cards, unlimited AI mocks, and PrepPath. One-time, 6 months. No auto-renew.",
  },
];

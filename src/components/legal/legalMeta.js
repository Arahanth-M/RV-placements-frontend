import { useLocation } from "react-router-dom";
import { GENERAL_BASE } from "../../constants/tenant.js";

export const LEGAL_LAST_UPDATED = "15 September 2026";

/**
 * Bump when the Privacy Policy notice changes in a material way (consent re-prompt).
 * Keep in sync with backend `PRIVACY_POLICY_VERSION` in
 * RV-placements-backend/config/privacyPolicy.js
 */
export const PRIVACY_POLICY_VERSION = "2026-11-13";
export const PRIVACY_POLICY_LAST_UPDATED = "13 November 2026";

export const LEGAL_BRAND = "One Stop Placement Prep";
export const LEGAL_OPERATOR = "Devomation AI";
export const LEGAL_WEBSITE = "https://onestopplacementprep.in";
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
    detail:
      "First company in each category for full details, 1 AI mock interview of any company, 1 PrepPath plan, and 1 behavioural coach question.",
  },
  {
    name: "Unlock one category",
    price: "₹199 + 18% GST",
    detail:
      "Company-card details for one category plus unlimited behavioural coach (up to 3 questions per hour). No AI mocks or PrepPath. One-time, 6 months. No auto-renew. GST added at checkout.",
  },
  {
    name: "Unlimited PrepPath",
    price: "₹399 + 18% GST",
    detail:
      "Unlimited PrepPath plus all company cards and unlimited behavioural coach. One-time, 6 months. No auto-renew. GST added at checkout.",
  },
  {
    name: "Unlimited AI mock interviews",
    price: "₹399 + 18% GST",
    detail:
      "Unlimited AI mocks plus all company cards and unlimited behavioural coach. One-time, 6 months. No auto-renew. GST added at checkout.",
  },
  {
    name: "All premium features",
    price: "₹599 + 18% GST",
    detail:
      "All company cards, unlimited AI mocks, unlimited PrepPath, and unlimited behavioural coach. One-time, 6 months. No auto-renew. GST added at checkout.",
  },
];

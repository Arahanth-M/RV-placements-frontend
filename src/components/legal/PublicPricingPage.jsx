import { useLocation } from "react-router-dom";
import LegalPageLayout, { LegalSection } from "./LegalPageLayout.jsx";
import { PUBLIC_PLAN_PRICES } from "./legalMeta.js";
import { GENERAL_BASE } from "../../constants/tenant.js";
import { PLATFORM_CONTACT_EMAIL } from "../../utils/constants";

export default function PublicPricingPage() {
  const { pathname } = useLocation();
  const inGeneral = String(pathname || "").startsWith(GENERAL_BASE);

  return (
    <LegalPageLayout
      title="Pricing"
      subtitle="One-time digital plans for Last Minute Placement Prep. No auto-renewal. Amounts in INR."
    >
      <LegalSection title="Plans">
        <div className="overflow-x-auto rounded-xl border border-theme">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-theme-hero text-theme-primary">
              <tr>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">What you get</th>
              </tr>
            </thead>
            <tbody>
              {PUBLIC_PLAN_PRICES.map((row) => (
                <tr key={row.name} className="border-t border-theme">
                  <td className="px-4 py-3 font-medium text-theme-primary">{row.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.price}</td>
                  <td className="px-4 py-3">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>
      <LegalSection title="How to buy">
        <p>
          {inGeneral ? (
            <>
              Checkout is on this same Pricing page in Student Corner after you sign in. Payments
              are processed by Razorpay.
            </>
          ) : (
            <>
              Sign in to Last Minute Placement Prep and open Pricing in Student Corner to purchase.
              Payments are processed by Razorpay.
            </>
          )}
        </p>
        <p>
          Questions:{" "}
          <a className="text-theme-accent underline" href={`mailto:${PLATFORM_CONTACT_EMAIL}`}>
            {PLATFORM_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}

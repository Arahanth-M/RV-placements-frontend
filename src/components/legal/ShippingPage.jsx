import { Link } from "react-router-dom";
import { PLATFORM_CONTACT_EMAIL } from "../../utils/constants";
import LegalPageLayout, { LegalSection } from "./LegalPageLayout.jsx";
import { LEGAL_BRAND, useLegalPath } from "./legalMeta.js";

export default function ShippingPage() {
  const legalPath = useLegalPath();

  return (
    <LegalPageLayout
      title="Shipping Policy"
      subtitle={`${LEGAL_BRAND} is a digital service. Nothing physical is shipped.`}
    >
      <LegalSection title="No physical shipping">
        <p>
          We do not sell or ship physical goods, kits, or printed material. This page exists so
          payment partners and customers can see how the product is delivered.
        </p>
      </LegalSection>

      <LegalSection title="How the service is delivered">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            After you sign in, free-trial features are available immediately in your browser on{" "}
            {LEGAL_BRAND}.
          </li>
          <li>
            After Razorpay confirms payment, paid entitlements are applied to your account at once
            (typically within a few minutes). You then unlock the matching company cards, AI
            mocks, and/or PrepPath features on the website.
          </li>
          <li>There is no courier, tracking number, or delivery address.</li>
        </ul>
      </LegalSection>

      <LegalSection title="If access does not appear">
        <p>
          Refresh the app and open{" "}
          <Link className="text-theme-accent underline" to={legalPath("/pricing")}>
            Pricing
          </Link>{" "}
          to confirm Current plans. If paid access is still missing, email{" "}
          <a className="text-theme-accent underline" href={`mailto:${PLATFORM_CONTACT_EMAIL}`}>
            {PLATFORM_CONTACT_EMAIL}
          </a>{" "}
          with your payment ID. See also the{" "}
          <Link className="text-theme-accent underline" to={legalPath("/refund")}>
            Cancellation & Refund Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}

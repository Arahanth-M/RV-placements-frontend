import { Link } from "react-router-dom";
import {
  DEVOMATION_AI_EMAIL,
  PLATFORM_CONTACT_EMAIL,
} from "../../utils/constants";
import LegalPageLayout, { LegalSection } from "./LegalPageLayout.jsx";
import { LEGAL_BRAND, useLegalPath } from "./legalMeta.js";

export default function RefundPage() {
  const legalPath = useLegalPath();

  return (
    <LegalPageLayout
      title="Cancellation & Refund Policy"
      subtitle={`How cancellations and refunds work for ${LEGAL_BRAND} paid plans.`}
    >
      <LegalSection title="Cancellations">
        <p>
          Paid plans on the Last Minute Placement Prep platform are one-time purchases for a
          six-month access window. There is no subscription and no auto-renewal, so there is
          nothing to cancel after a successful payment. Access continues until the plan expiry date
          shown on Pricing. You may stop using the product at any time; unused time is not
          automatically converted to credit.
        </p>
      </LegalSection>

      <LegalSection title="When a refund is available">
        <p>
          Refunds are issued only if the payment fails or if a technical issue prevents us from
          delivering the paid access you purchased. No other reason qualifies for a refund.
        </p>
      </LegalSection>

      <LegalSection title="Refund eligibility">
        <p>
          Successful payments that grant access are final. We do not refund change of mind, unused
          time, or partial use. If Razorpay shows a failed payment, you are not charged and no
          refund is needed. If you were charged because of a payment failure or a technical issue
          on our side, we will refund that charge.
        </p>
      </LegalSection>

      <LegalSection title="How to request a refund">
        <p>
          Email{" "}
          <a className="text-theme-accent underline" href={`mailto:${PLATFORM_CONTACT_EMAIL}`}>
            {PLATFORM_CONTACT_EMAIL}
          </a>{" "}
          with your account email, Razorpay payment ID, and a short description of the payment
          failure or technical issue. You can also use{" "}
          <Link className="text-theme-accent underline" to={legalPath("/contact")}>
            Contact Us
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Processing timeline and method">
        <p>
          Eligible refunds are initiated within 5–7 business days after we confirm the payment
          failure or technical issue. The amount is returned to the original payment method through
          Razorpay. Bank or UPI display time may take additional days depending on your provider.
          Confirmed refunds revoke the related paid entitlement.
        </p>
      </LegalSection>

      <LegalSection title="Business contact">
        <p>
          {LEGAL_BRAND} / Devomation AI — {DEVOMATION_AI_EMAIL}
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}

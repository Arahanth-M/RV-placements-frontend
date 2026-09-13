import { Link } from "react-router-dom";
import {
  DEVOMATION_AI_EMAIL,
  PLATFORM_CONTACT_EMAIL,
} from "../../utils/constants";
import LegalPageLayout, { LegalSection } from "./LegalPageLayout.jsx";
import { LEGAL_BRAND, LEGAL_OPERATOR, LEGAL_WEBSITE, useLegalPath } from "./legalMeta.js";

export default function TermsPage() {
  const legalPath = useLegalPath();

  return (
    <LegalPageLayout
      title="Terms & Conditions"
      subtitle={`Rules that govern use of ${LEGAL_BRAND}, operated by ${LEGAL_OPERATOR}.`}
    >
      <LegalSection title="Agreement">
        <p>
          By creating an account, signing in, browsing {LEGAL_WEBSITE}, or purchasing a paid plan,
          you agree to these Terms & Conditions, our{" "}
          <Link className="text-theme-accent underline" to={legalPath("/privacy")}>
            Privacy Policy
          </Link>
          ,{" "}
          <Link className="text-theme-accent underline" to={legalPath("/refund")}>
            Cancellation & Refund Policy
          </Link>
          , and{" "}
          <Link className="text-theme-accent underline" to={legalPath("/shipping")}>
            Shipping Policy
          </Link>
          . If you do not agree, do not use the platform.
        </p>
      </LegalSection>

      <LegalSection title="The platform">
        <p>
          Last Minute Placement Prep is a digital placement-preparation platform. It provides
          company insights, AI mock interviews, PrepPath study plans, resources, and related tools.
          It is not a university, employer, or placement office, and it does not guarantee
          internships, jobs, or interview outcomes.
        </p>
      </LegalSection>

      <LegalSection title="Accounts and eligibility">
        <p>
          You must provide accurate information, keep your login secure, and use the service only
          for your own preparation. You are responsible for activity under your account. We may
          suspend or close accounts that are shared, automated, abusive, or used to scrape or
          redistribute content.
        </p>
      </LegalSection>

      <LegalSection title="User responsibilities">
        <ul className="list-disc space-y-1 pl-5">
          <li>Use the platform lawfully and in line with your college’s academic honesty rules.</li>
          <li>Do not upload malware, attempt to bypass paywalls, or attack our systems.</li>
          <li>Do not copy, sell, or publish paid company content, mock questions, or PrepPath output as your own product.</li>
          <li>Treat AI-generated feedback as guidance, not as official hiring criteria.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Payment terms">
        <p>
          Paid access on the Last Minute Placement Prep platform is sold as one-time plans for six
          months. There is no auto-renewal. Prices are shown in INR on the{" "}
          <Link className="text-theme-accent underline" to={legalPath("/pricing")}>
            Pricing
          </Link>{" "}
          page and are GST-inclusive unless we state otherwise. Payments are processed by Razorpay.
          Access starts after Razorpay confirms a successful payment. Failed, cancelled, or
          incomplete checkouts do not create access.
        </p>
      </LegalSection>

      <LegalSection title="Service conditions">
        <p>
          Free trial access includes teaser company cards (the first company in each category), one
          lifetime free AI mock, and one lifetime free PrepPath plan. Resume builder, where
          offered, remains free. We may change features, limits, or catalogue content. We aim for
          high availability but do not warrant uninterrupted service.
        </p>
      </LegalSection>

      <LegalSection title="Liability and restrictions">
        <p>
          To the fullest extent permitted by Indian law, {LEGAL_OPERATOR} is not liable for loss of
          data, placement outcomes, third-party UPI/card failures, or indirect damages. Our
          aggregate liability for a paid plan is limited to the amount you paid for that plan.
          Content is for education only.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions:{" "}
          <a className="text-theme-accent underline" href={`mailto:${PLATFORM_CONTACT_EMAIL}`}>
            {PLATFORM_CONTACT_EMAIL}
          </a>{" "}
          or{" "}
          <a className="text-theme-accent underline" href={`mailto:${DEVOMATION_AI_EMAIL}`}>
            {DEVOMATION_AI_EMAIL}
          </a>
          . See{" "}
          <Link className="text-theme-accent underline" to={legalPath("/contact")}>
            Contact Us
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}

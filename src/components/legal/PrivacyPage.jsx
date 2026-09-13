import { Link } from "react-router-dom";
import {
  DEVOMATION_AI_EMAIL,
  PLATFORM_CONTACT_EMAIL,
} from "../../utils/constants";
import LegalPageLayout, { LegalSection } from "./LegalPageLayout.jsx";
import { LEGAL_BRAND, useLegalPath } from "./legalMeta.js";

export default function PrivacyPage() {
  const legalPath = useLegalPath();

  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle={`How ${LEGAL_BRAND} collects, uses, and stores personal data.`}
    >
      <LegalSection title="Data we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>Account data: name, email, college/scope, role, and sign-in identifiers (including Google OAuth).</li>
          <li>Profile and usage: company views, mock interview sessions, PrepPath plans, resume drafts you create, and similar activity logs.</li>
          <li>Billing data: plan chosen, order identifiers, payment status, and entitlement dates. We do not store full card numbers or UPI PINs.</li>
          <li>Technical data: IP address, browser/device type, and cookies needed to keep you signed in and measure product use.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Why we collect it">
        <p>
          We collect this information to create and secure your account, deliver company content
          and AI features, enforce free-trial and paid entitlements, process payments, prevent
          abuse, improve the product, and respond to support requests.
        </p>
      </LegalSection>

      <LegalSection title="How we use and store it">
        <p>
          Data is stored on cloud infrastructure (including MongoDB hosting and application
          servers). Access is limited to operators who need it to run the service. We retain
          account and billing records for as long as your account is active and as required for
          tax, dispute, and legal compliance, then delete or anonymise them where practicable.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <ul className="list-disc space-y-1 pl-5">
          <li>Razorpay — payment processing and checkout.</li>
          <li>Google — optional sign-in.</li>
          <li>Cloud database and hosting providers for application data.</li>
          <li>AI model providers used to generate mock interview and PrepPath content.</li>
        </ul>
        <p>
          Those providers process data under their own terms. Razorpay handles card/UPI credentials
          on its checkout; we receive payment confirmation identifiers, not your full card details.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          Subject to applicable law, you may request access, correction, or deletion of personal
          data we hold, or close your account. Email{" "}
          <a className="text-theme-accent underline" href={`mailto:${PLATFORM_CONTACT_EMAIL}`}>
            {PLATFORM_CONTACT_EMAIL}
          </a>{" "}
          or{" "}
          <a className="text-theme-accent underline" href={`mailto:${DEVOMATION_AI_EMAIL}`}>
            {DEVOMATION_AI_EMAIL}
          </a>
          . You may also use the{" "}
          <Link className="text-theme-accent underline" to={legalPath("/contact")}>
            Contact Us
          </Link>{" "}
          page. We may retain records required for payments, security, or law.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}

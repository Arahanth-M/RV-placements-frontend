import { Link } from "react-router-dom";
import { DEVOMATION_AI_EMAIL } from "../../utils/constants";
import LegalPageLayout, { LegalSection } from "./LegalPageLayout.jsx";
import {
  LEGAL_BRAND,
  LEGAL_LOCATION,
  LEGAL_OPERATOR,
  LEGAL_WEBSITE,
  PRIVACY_POLICY_LAST_UPDATED,
  PRIVACY_POLICY_VERSION,
  useLegalPath,
} from "./legalMeta.js";

/** DPDP-aligned privacy notice for the general (public) platform. */
export default function PrivacyPage() {
  const legalPath = useLegalPath();

  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle={`Notice under India’s Digital Personal Data Protection Act, 2023 — how ${LEGAL_BRAND} processes your personal data on the general platform.`}
      lastUpdated={PRIVACY_POLICY_LAST_UPDATED}
    >
      <p className="rounded-xl border border-theme bg-theme-card/60 px-4 py-3 text-xs text-theme-muted sm:text-sm">
        Notice version: <span className="font-semibold text-theme-primary">{PRIVACY_POLICY_VERSION}</span>
        . This page is a standalone notice for informed consent. It applies to the general product
        at {LEGAL_WEBSITE}.
      </p>

      <LegalSection title="1. Who we are (Data Fiduciary)">
        <p>
          {LEGAL_BRAND} is operated by {LEGAL_OPERATOR} ({LEGAL_LOCATION}). For personal data
          processed on the general platform, {LEGAL_OPERATOR} is the{" "}
          <strong className="font-semibold text-theme-primary">Data Fiduciary</strong>. You (the
          signed-in or registering individual) are the{" "}
          <strong className="font-semibold text-theme-primary">Data Principal</strong>.
        </p>
        <p>
          Privacy and grievance contact (authorised to respond to Data Principal communications):
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <a className="text-theme-accent underline" href={`mailto:${DEVOMATION_AI_EMAIL}`}>
              {DEVOMATION_AI_EMAIL}
            </a>
          </li>
          <li>
            <Link className="text-theme-accent underline" to={legalPath("/contact")}>
              Contact Us
            </Link>{" "}
            page
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Scope of this notice">
        <p>This notice covers personal data we process when you:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Browse the public site or the general dashboard as a guest</li>
          <li>Sign in with Google and use general-platform features</li>
          <li>Use free-trial or paid prep features (company cards, AI mocks, PrepPath, behavioural coach)</li>
          <li>Pay via Razorpay, submit content, create resume drafts, or express college-onboarding interest</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Personal data we collect (itemised)">
        <p>Depending on how you use the general platform, we may process:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-semibold text-theme-primary">Account &amp; identity:</strong>{" "}
            name, email address, Google account identifier, profile picture URL, role/scope on the
            platform.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Usage &amp; product activity:</strong>{" "}
            pages or company content you open, PrepPath plans and progress, practice/challenge
            attempts, daily active / last-active signals, and similar product analytics needed to
            run and improve the service.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">AI interview &amp; coaching:</strong>{" "}
            mock-interview configuration, questions shown, your answers (including code), scores,
            feedback, behavioural-coach attempts, and related evaluation traces.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Resume drafts:</strong> content you
            enter (which may include name, email, phone, education, and experience text).
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">User submissions:</strong> interview
            or prep content you submit, plus submitter name and email (unless you choose an
            anonymous option where offered).
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Billing &amp; entitlements:</strong>{" "}
            plan chosen, amounts (including GST), order status, Razorpay order/payment identifiers,
            and entitlement / access dates. We do{" "}
            <strong className="font-semibold text-theme-primary">not</strong> store full card
            numbers, CVV, or UPI PINs.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Interest / access requests:</strong>{" "}
            if sign-in is blocked or you ask for the platform at your college — email, display
            name, email domain, and college name you provide.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Technical data:</strong> IP address,
            browser/device type, and cookies or similar technology needed to keep you signed in,
            secure the service, and measure product use.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Purposes of processing (what this enables)">
        <p>We process the data above only for these specified purposes:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-semibold text-theme-primary">Account &amp; security:</strong>{" "}
            create and authenticate your account, prevent abuse, and keep the service secure.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Placement preparation:</strong> show
            company insights, PrepPath plans, challenges, and related learning tools on the general
            platform.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">AI features:</strong> run mock
            interviews and behavioural coaching, store session history for you to review, and
            evaluate answers to give feedback.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Payments &amp; access control:</strong>{" "}
            process checkout via Razorpay, record entitlements, enforce free-trial and paid plan
            limits.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Support &amp; communication:</strong>{" "}
            respond to contact requests and service notices. Marketing or non-essential email
            updates are sent only if you opt in separately.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Product analytics:</strong>{" "}
            understand feature usage (including daily active use) so we can operate and improve the
            general platform — not to sell your data or run third-party advertising profiles.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">College interest:</strong> record
            that you want the platform at your college and follow up on onboarding interest.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Legal compliance:</strong> meet tax,
            accounting, dispute, and other legal obligations (especially for billing records).
          </li>
        </ul>
        <p>
          We do not use your personal data for a new purpose that is incompatible with the above
          without giving you an updated notice and obtaining fresh consent where required.
        </p>
      </LegalSection>

      <LegalSection title="5. Consent and lawful basis">
        <p>
          On the general platform, we process your personal data primarily on the basis of your{" "}
          <strong className="font-semibold text-theme-primary">consent</strong>, given by a clear
          affirmative action after you have had access to this notice (for example accepting at
          sign-in, or continuing with a feature that asks for specific consent such as starting an
          AI interview or completing payment).
        </p>
        <p>
          Consent must be free, specific, informed, unconditional, and unambiguous, and is limited
          to the personal data necessary for the stated purpose. You may withdraw consent at any
          time (see Section 9). Withdrawal does not make past processing unlawful.
        </p>
        <p>
          Where another lawful ground under the DPDP Act applies for a narrow use (for example
          certain security or legal obligations), we will rely on that ground only as permitted by
          law.
        </p>
      </LegalSection>

      <LegalSection title="6. Who we share data with (processors &amp; third parties)">
        <p>
          We do not sell your personal data. We use service providers (Data Processors) under
          arrangements that require appropriate security, including:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Hetzner — hosting of the application</li>
          <li>Cloud database providers — storage of application data</li>
          <li>Google — sign-in (OAuth) and related identity</li>
          <li>Razorpay — payment checkout and payment confirmation</li>
          <li>AI model providers — generating and evaluating mock interview / PrepPath related content</li>
        </ul>
        <p>
          Razorpay handles card/UPI credentials on its checkout; we receive payment confirmation
          identifiers and status, not your full card details. Those providers also process data
          under their own terms where they act as independent controllers for their services.
        </p>
        <p>
          We may disclose data if required by law, regulation, or a lawful request from a competent
          authority, or to protect the rights, safety, and integrity of users and the platform.
        </p>
      </LegalSection>

      <LegalSection title="7. Where data is stored / cross-border processing">
        <p>
          The platform is hosted on infrastructure operated by Hetzner, together with our database
          hosting. Personal data may therefore be stored or processed outside India. We take steps
          consistent with applicable Indian law, including any Government restrictions on transfer
          to specific countries, and limit access to operators who need it to run the service.
        </p>
      </LegalSection>

      <LegalSection title="8. Retention">
        <p>We keep personal data only as long as needed for the purposes above, including:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="font-semibold text-theme-primary">Account data:</strong> while your
            account remains active, then deleted or anonymised when you close the account (subject
            to legal holds).
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Interview, coaching, PrepPath, resume drafts:</strong>{" "}
            while your account is active or until you delete that content / withdraw consent for
            that purpose.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Billing &amp; entitlements:</strong>{" "}
            for the life of the entitlement and as required for tax, dispute, and legal compliance,
            then deleted or anonymised where practicable.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Blocked-login / college interest records:</strong>{" "}
            typically up to about 30 days, after which they are automatically removed where that
            retention applies.
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Security / access logs:</strong> for
            a limited period needed to detect and investigate unauthorised access (generally up to
            about one year, unless a longer period is required by law).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Your rights under the DPDP Act">
        <p>Subject to the Act and applicable rules, you may:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="font-semibold text-theme-primary">Access</strong> a summary of
            personal data we hold about you and the processing activities
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Correct</strong> inaccurate or
            incomplete personal data
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Erase</strong> personal data that is
            no longer necessary for the stated purpose, or when you withdraw consent (unless
            retention is required by law)
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Withdraw consent</strong> as easily
            as you gave it, for processing that is based on consent
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Nominate</strong> another individual
            to exercise your rights in the event of death or incapacity, as provided under the Act
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Grievance redressal</strong> —
            contact us using the details in Section 1; we aim to resolve grievances within a
            reasonable period not exceeding 90 days
          </li>
          <li>
            <strong className="font-semibold text-theme-primary">Complaint to the Board</strong> —
            you may complain to the Data Protection Board of India if you are not satisfied with
            our response
          </li>
        </ul>
        <p>
          To exercise these rights, email{" "}
          <a className="text-theme-accent underline" href={`mailto:${DEVOMATION_AI_EMAIL}`}>
            {DEVOMATION_AI_EMAIL}
          </a>
          , or use the{" "}
          <Link className="text-theme-accent underline" to={legalPath("/contact")}>
            Contact Us
          </Link>{" "}
          page. Please include the email address linked to your account so we can verify the
          request. We may retain records required for payments, security, or law even after an
          erasure request.
        </p>
      </LegalSection>

      <LegalSection title="10. How to withdraw consent or close your account">
        <p>
          You may withdraw consent or request account closure by contacting the privacy emails
          above or via Contact Us. Where in-product controls exist (for example deleting a resume
          draft or interview history), you may use those as well.
        </p>
        <p>
          After withdrawal or closure, we will stop processing for that purpose within a reasonable
          time and instruct processors to stop where applicable, except for data we must keep under
          law (for example certain billing records). Some features will stop working if the data
          they need can no longer be processed.
        </p>
      </LegalSection>

      <LegalSection title="11. Children">
        <p>
          The general platform is intended for users who are 18 years of age or older. We do not
          knowingly offer the service to children. If you believe a child has provided personal
          data, contact us and we will take appropriate steps to delete it.
        </p>
      </LegalSection>

      <LegalSection title="12. Security">
        <p>
          We apply reasonable security safeguards appropriate to the nature of the data and the
          risks involved, including access controls, secure transmission (HTTPS), and limiting
          staff access to what is needed to operate the service. No method of transmission or
          storage is completely secure; please keep your sign-in credentials safe.
        </p>
      </LegalSection>

      <LegalSection title="13. Personal data breaches">
        <p>
          If a personal data breach is likely to affect you, we will take steps required under
          applicable law, including notifying affected individuals and the Data Protection Board of
          India as required, and providing information about the incident and recommended
          precautions where appropriate.
        </p>
      </LegalSection>

      <LegalSection title="14. Cookies and similar technologies">
        <p>
          We use cookies and similar technologies that are necessary to keep you signed in, protect
          the service, and understand product usage. You can control cookies through your browser
          settings; disabling necessary cookies may prevent sign-in or core features from working.
        </p>
      </LegalSection>

      <LegalSection title="15. Changes to this notice">
        <p>
          We may update this notice from time to time. The “Last updated” date and notice version
          at the top will change when we do. For material changes, we will provide a renewed notice
          and, where required, ask for fresh consent before continuing to process your data under
          the updated terms.
        </p>
      </LegalSection>

      <LegalSection title="16. Related policies">
        <p>
          Use of the platform is also governed by our{" "}
          <Link className="text-theme-accent underline" to={legalPath("/terms")}>
            Terms &amp; Conditions
          </Link>
          ,{" "}
          <Link className="text-theme-accent underline" to={legalPath("/refund")}>
            Cancellation &amp; Refund Policy
          </Link>
          , and{" "}
          <Link className="text-theme-accent underline" to={legalPath("/shipping")}>
            Shipping Policy
          </Link>
          . This Privacy Policy is the primary notice for personal data processing on the general
          platform.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}

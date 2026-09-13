import { Link } from "react-router-dom";
import {
  DEVOMATION_AI_EMAIL,
  PLATFORM_CONTACT_EMAIL,
  PLATFORM_LINKEDIN_URL,
} from "../../utils/constants";
import LegalPageLayout, { LegalSection } from "./LegalPageLayout.jsx";
import {
  LEGAL_BRAND,
  LEGAL_LOCATION,
  LEGAL_OPERATOR,
  LEGAL_WEBSITE,
  useLegalPath,
} from "./legalMeta.js";

export default function AboutPage() {
  const legalPath = useLegalPath();

  return (
    <LegalPageLayout
      title="About Us"
      subtitle={`${LEGAL_BRAND} is a digital placement-preparation platform from ${LEGAL_OPERATOR}.`}
    >
      <LegalSection title="Who we are">
        <p>
          {LEGAL_BRAND} (lastminuteplacementprep.in) helps students prepare for internships and
          campus placements with company insights, AI mock interviews, PrepPath plans, and related
          tools. The product is built and operated by {LEGAL_OPERATOR}.
        </p>
      </LegalSection>

      <LegalSection title="What we offer">
        <p>
          Students on the Last Minute Placement Prep platform can browse company categories, use a
          free trial (teaser cards, one AI mock, one PrepPath plan), and optionally purchase
          one-time six-month access for more cards, mocks, or PrepPath. Resume builder, where
          available, is free.
        </p>
      </LegalSection>

      <LegalSection title="Business details">
        <ul className="list-disc space-y-1 pl-5">
          <li>Product: {LEGAL_BRAND}</li>
          <li>Operator: {LEGAL_OPERATOR}</li>
          <li>
            Website:{" "}
            <a className="text-theme-accent underline" href={LEGAL_WEBSITE}>
              {LEGAL_WEBSITE}
            </a>
          </li>
          <li>Operating location: {LEGAL_LOCATION}</li>
          <li>
            Support:{" "}
            <a className="text-theme-accent underline" href={`mailto:${PLATFORM_CONTACT_EMAIL}`}>
              {PLATFORM_CONTACT_EMAIL}
            </a>
          </li>
          <li>
            Business:{" "}
            <a className="text-theme-accent underline" href={`mailto:${DEVOMATION_AI_EMAIL}`}>
              {DEVOMATION_AI_EMAIL}
            </a>
          </li>
          <li>
            LinkedIn:{" "}
            <a
              className="text-theme-accent underline"
              href={PLATFORM_LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Devomation AI
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Payments">
        <p>
          Payments on the Last Minute Placement Prep platform are processed by Razorpay. Plan names
          and prices are listed on{" "}
          <Link className="text-theme-accent underline" to={legalPath("/pricing")}>
            Pricing
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}

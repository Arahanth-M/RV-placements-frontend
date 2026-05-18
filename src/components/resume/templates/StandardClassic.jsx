import { pickProjectLinkLabel } from "../resumeLinkUtils";
import { CenteredResumeContact } from "../ResumeContactIcons";

const sectionTitleClass =
  "text-base font-semibold uppercase tracking-wide text-gray-700 mb-1 pb-0.5 border-b border-black";

const bodyTextClass = "text-base text-gray-800";
const metaTextClass = "text-sm text-gray-600";
const headingTextClass = "text-base font-semibold";

function formatDateRange(startDate, endDate) {
  const start = String(startDate || "").trim();
  const end = String(endDate || "").trim();
  if (start && end) return `${start}-${end}`;
  return start || end || "";
}

function resolveContactHref(type, value) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (type === "email") {
    return normalized.startsWith("mailto:") ? normalized : `mailto:${normalized}`;
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(normalized)) {
    return normalized;
  }
  return `https://${normalized.replace(/^\/\//, "")}`;
}

function ContactLink({ type, value, children }) {
  const href = resolveContactHref(type, value);
  if (!href) return null;
  return (
    <a
      className="text-sm text-blue-600 underline"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

function joinInline(items, separator = " | ") {
  return items.filter(Boolean).flatMap((item, idx) => (idx === 0 ? [item] : [separator, item]));
}

function BulletList({ bullets = [] }) {
  if (!Array.isArray(bullets) || bullets.length === 0) return null;
  return (
    <ul className={`list-disc ml-5 mt-1 space-y-1 ${bodyTextClass}`}>
      {bullets.map((item, idx) => (
        <li key={`${item?.text || "bullet"}-${idx}`}>{item?.text}</li>
      ))}
    </ul>
  );
}

function TitledDetailList({ items = [] }) {
  if (!items.length) return null;
  return items.map((item, idx) => (
    <p key={`item-${idx}`} className={`${bodyTextClass} mb-1`}>
      <span className="font-semibold">{item.title}</span>
      {item.detail ? ` - ${item.detail}` : ""}
    </p>
  ));
}

function CertificationList({ items = [] }) {
  if (!items.length) return null;
  return items.map((item, idx) => {
    const title = String(item.title || "").trim();
    const link = String(item.link || item.detail || "").trim();
    const href = link
      ? /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(link)
        ? link
        : `https://${link.replace(/^\/\//, "")}`
      : null;
    return (
      <p key={`cert-${idx}`} className={`${bodyTextClass} mb-1`}>
        {href ? (
          <a
            className="font-semibold text-blue-600 underline"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {title || "Certification"}
          </a>
        ) : (
          <span className="font-semibold">{title || "Certification"}</span>
        )}
      </p>
    );
  });
}

export default function StandardClassic({ draft }) {
  const personal = draft?.personal || {};
  const skillsList = Array.isArray(draft?.skills)
    ? draft.skills.map((s) => String(s ?? "").trim()).filter(Boolean)
    : [];
  const certifications = draft?.certifications || [];
  const achievements = draft?.achievements || [];

  return (
    <div
      data-resume-export-root
      className="bg-white text-gray-900 p-6 w-full text-base"
    >
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold">{personal.fullName || "Your Name"}</h1>
        {personal.location ? (
          <p className={`${metaTextClass} mt-1`}>{personal.location}</p>
        ) : null}
        <CenteredResumeContact personal={personal} className="mt-2" />
      </div>

      {personal.summary ? (
        <section className="mb-4">
          <h2 className={sectionTitleClass}>Summary</h2>
          <p className={bodyTextClass}>{personal.summary}</p>
        </section>
      ) : null}

      <section className="mb-4">
        <h2 className={sectionTitleClass}>Education</h2>
        {(draft?.education || []).map((item, idx) => (
          <div key={`edu-${idx}`} className="mb-2">
            <p className={headingTextClass}>{item.institution || "Institution"}</p>
            <p className={bodyTextClass}>
              {[item.degree, item.field].filter(Boolean).join(" - ")}
            </p>
            <p className={metaTextClass}>
              {[formatDateRange(item.startDate, item.endDate), item.score, item.location]
                .filter(Boolean)
                .join(" | ")}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-4">
        <h2 className={sectionTitleClass}>Skills</h2>
        <p className={bodyTextClass}>{skillsList.length > 0 ? skillsList.join(", ") : "\u2014"}</p>
      </section>

      <section className="mb-4">
        <h2 className={sectionTitleClass}>Projects</h2>
        {(draft?.projects || []).map((item, idx) => {
          const link = String(item.link || "").trim();
          return (
            <div key={`project-${idx}`} className="mb-2">
              <p className={headingTextClass}>
                {[item.name, item.techStack].filter(Boolean).join(" | ")}
              </p>
              <p className={metaTextClass}>
                {joinInline([
                  formatDateRange(item.startDate, item.endDate) || null,
                  link ? (
                    <ContactLink type="link" value={link}>
                      {pickProjectLinkLabel(item)}
                    </ContactLink>
                  ) : null,
                ])}
              </p>
              <BulletList bullets={item.bullets} />
            </div>
          );
        })}
      </section>

      <section className="mb-4">
        <h2 className={sectionTitleClass}>Experience</h2>
        {(draft?.experience || []).map((item, idx) => (
          <div key={`exp-${idx}`} className="mb-2">
            <p className={headingTextClass}>{[item.role, item.company].filter(Boolean).join(" - ")}</p>
            {item.techStack ? (
              <p className={`${bodyTextClass} italic text-gray-700`}>{item.techStack}</p>
            ) : null}
            <p className={metaTextClass}>
              {[formatDateRange(item.startDate, item.endDate), item.location].filter(Boolean).join(" | ")}
            </p>
            <BulletList bullets={item.bullets} />
          </div>
        ))}
      </section>

      {certifications.length > 0 ? (
        <section className="mb-4">
          <h2 className={sectionTitleClass}>Certifications</h2>
          <CertificationList items={certifications} />
        </section>
      ) : null}

      {achievements.length > 0 ? (
        <section>
          <h2 className={sectionTitleClass}>Achievements</h2>
          <TitledDetailList items={achievements} />
        </section>
      ) : null}
    </div>
  );
}

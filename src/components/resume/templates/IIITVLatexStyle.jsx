import { pickProjectLinkLabel } from "../resumeLinkUtils";
import { RightResumeContact } from "../ResumeContactIcons";

const sectionTitleClass =
  "text-base font-semibold tracking-wide text-gray-800 mb-1 pb-0.5 border-b border-black";
const bodyTextClass = "text-base text-gray-800";
const rowTitleClass = "text-base font-semibold";
const rowMetaClass = "text-base text-gray-800";

function ContactLink({ type, value, children, className = "underline text-blue-700" }) {
  const href =
    type === "email"
      ? `mailto:${String(value || "").trim()}`
      : /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(String(value || "").trim())
        ? String(value).trim()
        : `https://${String(value || "").trim().replace(/^\/\//, "")}`;

  if (!String(value || "").trim()) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="mt-3 mb-2">
      <h2 className={sectionTitleClass} style={{ fontVariant: "small-caps" }}>
        {children}
      </h2>
    </div>
  );
}

function DateRight({ left, right, subLeft, subRight, subRightHref }) {
  return (
    <div className="mb-2">
      <div className="flex items-start justify-between gap-2">
        <p className={rowTitleClass}>{left}</p>
        <p className={`${rowTitleClass} text-right shrink-0`}>{right}</p>
      </div>
      {(subLeft || subRight) && (
        <div className="flex items-start justify-between gap-2">
          <p className={`${rowMetaClass} italic`}>{subLeft}</p>
          <p className={`${rowMetaClass} text-right shrink-0`}>
            {subRightHref ? (
              <ContactLink type="link" value={subRightHref} className="underline text-blue-700">
                {subRight}
              </ContactLink>
            ) : (
              subRight
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default function IIITVLatexStyle({ draft }) {
  const personal = draft?.personal || {};
  const education = draft?.education || [];
  const projects = draft?.projects || [];
  const experience = draft?.experience || [];
  const certifications = draft?.certifications || [];
  const achievements = draft?.achievements || [];
  const skills = Array.isArray(draft?.skills)
    ? draft.skills.map((s) => String(s ?? "").trim()).filter(Boolean)
    : [];
  const summary = String(personal.summary || "").trim();

  return (
    <div
      data-resume-export-root
      className="bg-white text-black w-full p-6 font-serif leading-normal text-base"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      <header className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold leading-tight">
              {personal.fullName || "Your Name"}
            </h1>
            <p className="text-sm text-gray-700 mt-1">{personal.location || "Your Location"}</p>
          </div>
          <RightResumeContact personal={personal} />
        </div>
      </header>

      {summary ? (
        <section className="mb-4">
          <SectionTitle>Summary</SectionTitle>
          <p className={bodyTextClass}>{summary}</p>
        </section>
      ) : null}

      <section className="mb-4">
        <SectionTitle>Education</SectionTitle>
        {education.map((item, idx) => (
          <DateRight
            key={`edu-${idx}`}
            left={item.institution || "Institute / School"}
            right={item.score || "CGPA/Percentage"}
            subLeft={[item.degree, item.field].filter(Boolean).join(" - ") || "Degree and Course"}
            subRight={
              [[item.startDate, item.endDate].filter(Boolean).join(" - "), item.location]
                .filter(Boolean)
                .join("  |  ") || "Year"
            }
          />
        ))}
      </section>

      <section className="mb-4">
        <SectionTitle>Experience</SectionTitle>
        {experience.map((item, idx) => (
          <div key={`exp-${idx}`} className="mb-2">
            <DateRight
              left={item.company || "Company Name"}
              right={item.location || "City"}
              subLeft={item.role || "Role"}
              subRight={[item.startDate, item.endDate].filter(Boolean).join(" - ") || "Event Dates"}
            />
            {item.techStack ? (
              <p className={`${rowMetaClass} italic mb-1`}>{item.techStack}</p>
            ) : null}
            <ul className={`list-disc ml-5 mt-1 space-y-1 ${bodyTextClass}`}>
              {(item.bullets || []).map((bullet, bulletIdx) => (
                <li key={`exp-b-${idx}-${bulletIdx}`}>{bullet.text}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mb-4">
        <SectionTitle>Projects</SectionTitle>
        {projects.map((item, idx) => {
          const link = String(item.link || "").trim();
          const linkLabel = link ? pickProjectLinkLabel(item) : "";
          return (
            <div key={`project-${idx}`} className="mb-2">
              <DateRight
                left={item.name || "Project Name"}
                right={[item.startDate, item.endDate].filter(Boolean).join(" - ") || ""}
                subLeft={item.techStack || "Tools & technologies"}
                subRight={linkLabel}
                subRightHref={link || null}
              />
              <ul className={`list-disc ml-5 mt-1 space-y-1 ${bodyTextClass}`}>
                {(item.bullets || []).map((bullet, bulletIdx) => (
                  <li key={`proj-b-${idx}-${bulletIdx}`}>{bullet.text}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="mb-4">
        <SectionTitle>Technical Skills and Interests</SectionTitle>
        <p className={bodyTextClass}>
          {skills.join(", ") || "Languages, Tools, Frameworks, Databases, Soft Skills, Coursework, Interests"}
        </p>
      </section>

      {certifications.length > 0 ? (
        <section className="mb-4">
          <SectionTitle>Certifications</SectionTitle>
          <ul className={`list-disc ml-5 mt-1 space-y-1 ${bodyTextClass}`}>
            {certifications.map((item, idx) => {
              const title = String(item.title || "").trim() || "Certification";
              const link = String(item.link || item.detail || "").trim();
              const href = link
                ? /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(link)
                  ? link
                  : `https://${link.replace(/^\/\//, "")}`
                : null;
              return (
                <li key={`cert-${idx}`}>
                  {href ? (
                    <ContactLink type="link" value={href} className="font-semibold underline text-blue-700">
                      {title}
                    </ContactLink>
                  ) : (
                    <span className="font-semibold">{title}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {achievements.length > 0 ? (
        <section>
          <SectionTitle>Achievements</SectionTitle>
          <ul className={`list-disc ml-5 mt-1 space-y-1 ${bodyTextClass}`}>
            {achievements.map((item, idx) => (
              <li key={`ach-${idx}`}>
                <span className="font-semibold">{item.title || "Achievement"}</span>
                {item.detail ? ` - ${item.detail}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

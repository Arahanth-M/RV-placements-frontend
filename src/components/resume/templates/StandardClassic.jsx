const sectionTitleClass = "text-sm font-semibold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-1 mb-2";

function formatDateRange(startDate, endDate) {
  const start = String(startDate || "").trim();
  const end = String(endDate || "").trim();
  if (start && end) return `${start}-${end}`;
  return start || end || "";
}

function BulletList({ bullets = [] }) {
  if (!Array.isArray(bullets) || bullets.length === 0) return null;
  return (
    <ul className="list-disc ml-5 mt-1 space-y-1 text-[13px] text-gray-800">
      {bullets.map((item, idx) => (
        <li key={`${item?.text || "bullet"}-${idx}`}>{item?.text}</li>
      ))}
    </ul>
  );
}

export default function StandardClassic({ draft }) {
  const personal = draft?.personal || {};
  return (
    <div className="bg-white text-gray-900 p-6 shadow-sm min-h-[900px]">
      <div className="text-center border-b border-gray-300 pb-3 mb-4">
        <h1 className="text-2xl font-bold">{personal.fullName || "Your Name"}</h1>
        <p className="text-sm text-gray-700">
          {[personal.email, personal.phone, personal.location].filter(Boolean).join(" | ")}
        </p>
        <p className="text-xs text-gray-600">
          {[personal.linkedin, personal.github].filter(Boolean).join(" | ")}
        </p>
      </div>

      {personal.summary ? (
        <section className="mb-4">
          <h2 className={sectionTitleClass}>Summary</h2>
          <p className="text-[13px] text-gray-800">{personal.summary}</p>
        </section>
      ) : null}

      <section className="mb-4">
        <h2 className={sectionTitleClass}>Education</h2>
        {(draft?.education || []).map((item, idx) => (
          <div key={`edu-${idx}`} className="mb-2">
            <p className="text-sm font-semibold">{item.institution || "Institution"}</p>
            <p className="text-[13px] text-gray-800">
              {[item.degree, item.field].filter(Boolean).join(" - ")}
            </p>
            <p className="text-xs text-gray-600">
              {[formatDateRange(item.startDate, item.endDate), item.score, item.location]
                .filter(Boolean)
                .join(" | ")}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-4">
        <h2 className={sectionTitleClass}>Skills</h2>
        <p className="text-[13px] text-gray-800">{(draft?.skills || []).join(", ")}</p>
      </section>

      <section className="mb-4">
        <h2 className={sectionTitleClass}>Projects</h2>
        {(draft?.projects || []).map((item, idx) => (
          <div key={`project-${idx}`} className="mb-2">
            <p className="text-sm font-semibold">
              {[item.name, item.techStack].filter(Boolean).join(" | ")}
            </p>
            <p className="text-xs text-gray-600">
              {[formatDateRange(item.startDate, item.endDate), item.link].filter(Boolean).join(" | ")}
            </p>
            <BulletList bullets={item.bullets} />
          </div>
        ))}
      </section>

      <section className="mb-4">
        <h2 className={sectionTitleClass}>Experience</h2>
        {(draft?.experience || []).map((item, idx) => (
          <div key={`exp-${idx}`} className="mb-2">
            <p className="text-sm font-semibold">{[item.role, item.company].filter(Boolean).join(" - ")}</p>
            <p className="text-xs text-gray-600">
              {[formatDateRange(item.startDate, item.endDate), item.location].filter(Boolean).join(" | ")}
            </p>
            <BulletList bullets={item.bullets} />
          </div>
        ))}
      </section>

      <section>
        <h2 className={sectionTitleClass}>Achievements</h2>
        {(draft?.achievements || []).map((item, idx) => (
          <p key={`ach-${idx}`} className="text-[13px] text-gray-800 mb-1">
            <span className="font-semibold">{item.title}</span>
            {item.detail ? ` - ${item.detail}` : ""}
          </p>
        ))}
      </section>
    </div>
  );
}

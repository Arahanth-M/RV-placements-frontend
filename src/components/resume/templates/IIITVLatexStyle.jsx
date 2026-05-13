function SectionTitle({ children }) {
  return (
    <div className="mt-3 mb-1.5">
      <h2 className="text-[13px] font-bold uppercase tracking-wide">{children}</h2>
      <div className="h-[1px] bg-black mt-1" />
    </div>
  );
}

function DateRight({ left, right, subLeft, subRight }) {
  return (
    <div className="mb-1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-semibold">{left}</p>
        <p className="text-[11px]">{right}</p>
      </div>
      {(subLeft || subRight) && (
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] italic">{subLeft}</p>
          <p className="text-[11px]">{subRight}</p>
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
  const achievements = draft?.achievements || [];
  const skills = Array.isArray(draft?.skills)
    ? draft.skills.map((s) => String(s ?? "").trim()).filter(Boolean)
    : [];

  return (
    <div className="bg-white text-black min-h-[900px] p-6 font-serif">
      <header className="mb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-bold leading-tight">{personal.fullName || "Your Name"}</h1>
            <p className="text-[12px]">{personal.location || "Your Location"}</p>
          </div>
          <div className="text-right text-[11px] leading-5">
            <p>{personal.phone || "+91-xxxxxxxxxx"}</p>
            <p>{personal.email || "youremail@email.com"}</p>
            <p>{personal.github || "GitHub Profile"}</p>
            <p>{personal.linkedin || "LinkedIn Profile"}</p>
          </div>
        </div>
      </header>

      <SectionTitle>Education</SectionTitle>
      {education.map((item, idx) => (
        <DateRight
          key={`edu-${idx}`}
          left={item.institution || "Institute / School"}
          right={item.score || "CGPA/Percentage"}
          subLeft={[item.degree, item.field].filter(Boolean).join(" - ") || "Degree and Course"}
          subRight={[item.startDate, item.endDate].filter(Boolean).join(" - ") || "Year"}
        />
      ))}

      <SectionTitle>Experience</SectionTitle>
      {experience.map((item, idx) => (
        <div key={`exp-${idx}`} className="mb-2">
          <DateRight
            left={item.company || "Company Name"}
            right={item.location || "City"}
            subLeft={item.role || "Role"}
            subRight={[item.startDate, item.endDate].filter(Boolean).join(" - ") || "Event Dates"}
          />
          <ul className="list-disc ml-5 text-[11px]">
            {(item.bullets || []).map((bullet, bulletIdx) => (
              <li key={`exp-b-${idx}-${bulletIdx}`}>{bullet.text}</li>
            ))}
          </ul>
        </div>
      ))}

      <SectionTitle>Personal Projects</SectionTitle>
      {projects.map((item, idx) => (
        <div key={`project-${idx}`} className="mb-2">
          <DateRight
            left={item.name || "Project Name"}
            right={[item.startDate, item.endDate].filter(Boolean).join(" - ") || "Event Dates"}
            subLeft={item.techStack || "Tools & technologies"}
            subRight={item.link || ""}
          />
          <ul className="list-disc ml-5 text-[11px]">
            {(item.bullets || []).map((bullet, bulletIdx) => (
              <li key={`proj-b-${idx}-${bulletIdx}`}>{bullet.text}</li>
            ))}
          </ul>
        </div>
      ))}

      <SectionTitle>Technical Skills and Interests</SectionTitle>
      <p className="text-[11px]">{skills.join(", ") || "Languages, Tools, Frameworks, Databases, Soft Skills, Coursework, Interests"}</p>

      <SectionTitle>Achievements</SectionTitle>
      <ul className="list-disc ml-5 text-[11px]">
        {achievements.map((item, idx) => (
          <li key={`ach-${idx}`}>
            <span className="font-semibold">{item.title || "Achievement"}</span>
            {item.detail ? ` - ${item.detail}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

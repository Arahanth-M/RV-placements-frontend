import React from "react";
import { FaUser, FaLinkedin, FaEnvelope } from "react-icons/fa";

const developers = [
  {
    name: "Akshatha A",
    role: "Frontend developer",
    photo: "/developers/akshatha.jpeg",
    social: {
      linkedin: "https://www.linkedin.com/in/akshatha-anil-871b5825b/",
      email: "akshathaa.cs22@rvce.edu.in",
      website: "",
    },
  },
  {
    name: "Arahanth M",
    role: "Software Product Developer",
    photo: "/developers/arahanth.jpeg",
    social: {
      linkedin: "https://www.linkedin.com/in/arahanth-m-4379731b5/",
      email: "arahanthm.cs22@rvce.edu.in",
      website: "",
    },
  },
  {
    name: "Darshan Kashyap N",
    role: "Business Development & Outreach",
    photo: "/developers/darshan.jpeg",
    /** Favor lower half of image (crop more from top) */
    photoObjectClass: "object-bottom",
    social: {
      linkedin: "https://www.linkedin.com/in/darshan-kashyap-n-5032012a4/",
      email: "darshankn.cs22@rvce.edu.in",
      website: "",
    },
  },
];

function initialsFromName(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/** Fixed height so every card shows the same photo area size. */
const PHOTO_H = "h-[240px] min-h-[240px] sm:h-[280px] sm:min-h-[280px]";

function DevCardHero({ name, photo, photoObjectClass }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showPhoto = Boolean(photo) && !imageFailed;
  const positionClass = photoObjectClass?.trim() || "object-center";

  return (
    <div
      className={`relative w-full shrink-0 overflow-hidden border-b border-theme bg-theme-hero ${PHOTO_H}`}
    >
      {showPhoto ? (
        <img
          src={photo}
          alt={name}
          className={`h-full w-full object-cover ${positionClass}`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-theme-accent/90 text-5xl font-bold text-white sm:text-6xl"
          aria-hidden
        >
          {initialsFromName(name)}
        </div>
      )}
    </div>
  );
}

/** Ensures anchors open correct URLs when values omit https:// (e.g. linkedin.com/in/...). */
function normalizeWebHref(raw) {
  const s = raw?.trim() ?? "";
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  return `https://${s}`;
}

function normalizeEmailHref(raw) {
  const s = raw?.trim() ?? "";
  if (!s) return "";
  if (s.toLowerCase().startsWith("mailto:")) return s;
  return `mailto:${s}`;
}

function DevSocialLinks({ social }) {
  const linkedin = normalizeWebHref(social?.linkedin);
  const email = (social?.email || "").trim();
  const emailHref = normalizeEmailHref(email);

  return (
    <div
      className="mt-4 flex w-full flex-wrap items-center justify-center gap-2.5 border-t border-theme pt-4"
      role="list"
    >
      {linkedin ? (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          title={linkedin}
          aria-label={`Open LinkedIn: ${linkedin}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A66C2] text-white shadow-sm ring-1 ring-black/10 transition hover:scale-105 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A66C2] dark:ring-white/10"
          role="listitem"
        >
          <FaLinkedin className="h-4 w-4" aria-hidden />
        </a>
      ) : null}
      {email && emailHref ? (
        <a
          href={emailHref}
          title={email}
          aria-label={`Email ${email}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-theme-accent text-white shadow-sm ring-1 ring-black/10 transition hover:scale-105 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent dark:ring-white/10"
          role="listitem"
        >
          <FaEnvelope className="h-4 w-4" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

function DeveloperProfileCard({ developer }) {
  const { social } = developer;

  return (
    <article className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-theme bg-theme-card text-center shadow-[var(--shadow-soft)] transition-shadow hover:shadow-md">
      <DevCardHero
        name={developer.name}
        photo={developer.photo}
        photoObjectClass={developer.photoObjectClass}
      />

      <footer className="flex shrink-0 flex-col items-center bg-theme-card px-4 py-5 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-theme-primary sm:text-[1.65rem]">
          {developer.name}
        </h2>
        {developer.role ? (
          <p className="mt-2 text-base font-medium leading-snug text-theme-secondary sm:text-lg">
            {developer.role}
          </p>
        ) : null}
        <div className="w-full max-w-full">
          <DevSocialLinks social={social} />
        </div>
      </footer>
    </article>
  );
}

function Developers() {
  return (
    <div className="min-h-screen flex flex-col bg-theme-app text-theme-primary">
      <div className="flex min-h-0 flex-1 flex-col w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <header className="mb-8 shrink-0 text-center sm:mb-10">
          <h1 className="mb-2 text-2xl font-bold text-theme-primary sm:mb-3 sm:text-3xl md:text-4xl">
            Our Developers
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-theme-secondary sm:text-base md:text-lg">
            Meet the team behind the platform
          </p>
        </header>

        {developers.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-12 text-center">
            <div>
              <FaUser
                className="mx-auto mb-4 text-4xl text-theme-muted sm:text-6xl"
                aria-hidden
              />
              <p className="text-base text-theme-secondary sm:text-lg">
                No developers added yet.
              </p>
              <p className="mt-2 text-sm text-theme-muted sm:text-base">
                Check back soon!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-1 content-start justify-items-center gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-10">
            {developers.map((developer) => (
              <DeveloperProfileCard
                key={developer.name}
                developer={developer}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Developers;

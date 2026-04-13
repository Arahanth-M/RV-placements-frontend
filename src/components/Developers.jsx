import React from "react";
import {
  FaUser,
  FaLinkedin,
  FaGithub,
  FaEnvelope,
  FaGlobe,
} from "react-icons/fa";

const developers = [
  {
    name: "Arahanth M",
    photo: "/developers/arahanth.jpg",
    social: {
      linkedin: "https://www.linkedin.com/in/arahanth-m-4379731b5",
      github: "https://github.com/Arahanth-M",
      email: "",
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

function DevCardHero({ name, photo }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showPhoto = Boolean(photo) && !imageFailed;

  return (
    <div className="relative min-h-0 flex-1 w-full bg-neutral-200">
      {showPhoto ? (
        <img
          src={photo}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center bg-violet-600 text-5xl font-bold text-white sm:text-6xl"
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

function DevSocialRow({ social }) {
  const items = [
    {
      key: "linkedin",
      href: normalizeWebHref(social?.linkedin),
      Icon: FaLinkedin,
      label: "LinkedIn",
    },
    {
      key: "github",
      href: normalizeWebHref(social?.github),
      Icon: FaGithub,
      label: "GitHub",
    },
    {
      key: "email",
      href: (() => {
        const raw = social?.email?.trim() ?? "";
        if (!raw) return "";
        return raw.startsWith("mailto:") ? raw : `mailto:${raw}`;
      })(),
      Icon: FaEnvelope,
      label: "Email",
    },
    {
      key: "website",
      href: normalizeWebHref(social?.website),
      Icon: FaGlobe,
      label: "Website",
    },
  ];

  return (
    <div className="flex shrink-0 items-center gap-4 sm:gap-5 text-neutral-900">
      {items.map(({ key, href, Icon, label }) => {
        const icon = (
          <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" aria-hidden />
        );
        if (!href) {
          return (
            <span key={key} className="opacity-25" aria-hidden>
              {icon}
            </span>
          );
        }
        const isMail = href.startsWith("mailto:");
        return (
          <a
            key={key}
            href={href}
            {...(isMail
              ? {}
              : { target: "_blank", rel: "noopener noreferrer" })}
            aria-label={label}
            className="transition-opacity hover:opacity-65"
          >
            {icon}
          </a>
        );
      })}
    </div>
  );
}

function DeveloperProfileCard({ developer }) {
  const { social } = developer;

  return (
    <article className="flex h-[min(520px,calc(100svh-14rem))] sm:h-[min(560px,calc(100svh-13rem))] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5 transition-shadow hover:shadow-xl mx-auto">
      <DevCardHero name={developer.name} photo={developer.photo} />

      <footer className="flex min-h-[4.25rem] shrink-0 flex-col items-start gap-2 bg-white px-4 py-3 sm:min-h-[4.5rem] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
        <h2 className="w-full text-base font-semibold tracking-tight text-neutral-900 sm:w-auto sm:text-lg">
          {developer.name}
        </h2>
        <div className="w-full sm:w-auto">
          <DevSocialRow social={social} />
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
          <div className="grid flex-1 grid-cols-1 content-start justify-items-center gap-8 lg:grid-cols-2 lg:gap-10">
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

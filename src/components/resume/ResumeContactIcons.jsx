import { FaEnvelope, FaGithub, FaLinkedin, FaPhone } from "react-icons/fa";

function resolveHref(type, value) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (type === "email") {
    return normalized.startsWith("mailto:") ? normalized : `mailto:${normalized}`;
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(normalized)) return normalized;
  return `https://${normalized.replace(/^\/\//, "")}`;
}

function ContactItem({ icon: Icon, href, children, className = "", underline = false }) {
  const content = (
    <span
      className={[
        "inline-flex items-center gap-1",
        underline ? "underline" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span>{children}</span>
    </span>
  );

  if (!href) return content;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-inherit hover:opacity-80">
      {content}
    </a>
  );
}

/** Centered contact row (Standard ATS header). */
export function CenteredResumeContact({ personal, className = "" }) {
  const items = [];
  if (personal.phone) {
    items.push(
      <ContactItem key="phone" icon={FaPhone}>
        {personal.phone}
      </ContactItem>
    );
  }
  if (personal.email) {
    items.push(
      <ContactItem
        key="email"
        icon={FaEnvelope}
        href={resolveHref("email", personal.email)}
        underline
      >
        {personal.email}
      </ContactItem>
    );
  }
  if (personal.linkedin) {
    items.push(
      <ContactItem
        key="linkedin"
        icon={FaLinkedin}
        href={resolveHref("linkedin", personal.linkedin)}
        underline
      >
        LinkedIn
      </ContactItem>
    );
  }
  if (personal.github) {
    items.push(
      <ContactItem
        key="github"
        icon={FaGithub}
        href={resolveHref("github", personal.github)}
        underline
      >
        GitHub
      </ContactItem>
    );
  }

  if (!items.length) return null;

  return (
    <p
      className={[
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-gray-800",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item, idx) => (
        <span key={item.key} className="inline-flex items-center gap-3">
          {idx > 0 ? <span className="text-gray-400 select-none" aria-hidden>|</span> : null}
          {item}
        </span>
      ))}
    </p>
  );
}

/** Right-aligned contact block (IIITV header). */
export function RightResumeContact({ personal, className = "" }) {
  const rows = [];
  if (personal.phone) {
    rows.push({ key: "phone", icon: FaPhone, text: personal.phone, href: null, underline: false });
  }
  if (personal.email) {
    rows.push({
      key: "email",
      icon: FaEnvelope,
      text: personal.email,
      href: resolveHref("email", personal.email),
      underline: true,
    });
  }
  if (personal.linkedin) {
    rows.push({
      key: "linkedin",
      icon: FaLinkedin,
      text: "LinkedIn",
      href: resolveHref("linkedin", personal.linkedin),
      underline: true,
    });
  }
  if (personal.github) {
    rows.push({
      key: "github",
      icon: FaGithub,
      text: "GitHub",
      href: resolveHref("github", personal.github),
      underline: true,
    });
  }

  if (!rows.length) return null;

  return (
    <div className={["text-right text-sm leading-5 shrink-0 space-y-0.5", className].join(" ")}>
      {rows.map((row) => (
        <p key={row.key} className="flex items-center justify-end gap-1">
          <row.icon className="h-3 w-3 shrink-0" aria-hidden />
          {row.href ? (
            <a
              href={row.href}
              target="_blank"
              rel="noopener noreferrer"
              className={row.underline ? "underline" : ""}
            >
              {row.text}
            </a>
          ) : (
            <span>{row.text}</span>
          )}
        </p>
      ))}
    </div>
  );
}

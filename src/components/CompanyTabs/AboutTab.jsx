import React from "react";

const headingClassName =
  "mt-5 mb-1.5 text-base sm:text-[1.05rem] font-bold text-theme-accent leading-snug first:mt-0";

const bodyClassName = "text-sm sm:text-base text-theme-secondary leading-relaxed";

function stripAboutMarkup(text) {
  return String(text)
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(strong|b|em|i)>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

/** Collapse hard line breaks inside paragraphs (common in pasted / PDF about text). */
function flattenAboutText(text) {
  return stripAboutMarkup(text)
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCountBeforeColon(label) {
  const core = String(label || "")
    .replace(/:\s*$/, "")
    .replace(/^\d+\.\s*/, "")
    .trim();
  if (!core) return 0;
  return core.split(/\s+/).filter(Boolean).length;
}

/** Real section titles — not short fragments like `Culture & Values:` on their own line. */
function isSectionHeadingLabel(headingWithColon) {
  const label = String(headingWithColon || "").trim();
  if (!label.endsWith(":")) return false;
  const core = label.slice(0, -1).trim();
  if (core.length < 12 || core.length > 160) return false;
  if (!/^(?:\d+\.\s*)?[A-Z]/.test(label)) return false;
  if (/^\d+\.\s+/.test(label)) return wordCountBeforeColon(label) >= 2;
  return wordCountBeforeColon(label) >= 3;
}

/** Split into `1. …`, `2. …` blocks, or sentence-bounded unnumbered sections (Daimler-style). */
function splitAboutIntoBlocks(flat) {
  if (!flat) return [];

  const numbered = flat.split(/(?=\d+\.\s+)/).map((p) => p.trim()).filter(Boolean);
  if (numbered.length > 1) return numbered;

  const unnumbered = flat.split(
    /(?<=\.)\s+(?=[A-Z](?:[A-Za-z0-9&,()'.\-\s]{14,100}:))/
  );
  if (unnumbered.length > 1) return unnumbered.map((p) => p.trim()).filter(Boolean);

  return [flat];
}

function parseAboutBlock(block) {
  const trimmed = block.trim();
  if (!trimmed) return null;

  const inline = trimmed.match(/^((?:\d+\.\s*)?[A-Z][^:]{12,160}:)\s*(.*)$/s);
  if (inline && isSectionHeadingLabel(inline[1])) {
    return {
      kind: "section",
      heading: inline[1].trim(),
      body: inline[2].trim(),
    };
  }

  if (/^[-\u2022]/.test(trimmed)) {
    return { kind: "bullet", text: trimmed };
  }

  return { kind: "paragraph", text: trimmed };
}

function AboutTab({ company = {} }) {
  const formatAboutCompany = (text) => {
    if (!text) {
      return (
        <p className={bodyClassName}>
          No about information available for this company.
        </p>
      );
    }

    const flat = flattenAboutText(text);
    const blocks = splitAboutIntoBlocks(flat);
    const nodes = [];
    let key = 0;

    for (const block of blocks) {
      const parsed = parseAboutBlock(block);
      if (!parsed) continue;

      if (parsed.kind === "section") {
        nodes.push(
          <h3 key={key++} className={headingClassName}>
            {parsed.heading}
          </h3>
        );
        if (parsed.body) {
          nodes.push(
            <p key={key++} className={bodyClassName}>
              {parsed.body}
            </p>
          );
        }
        continue;
      }

      if (parsed.kind === "bullet") {
        nodes.push(
          <p key={key++} className={`ml-4 ${bodyClassName}`}>
            {parsed.text}
          </p>
        );
        continue;
      }

      nodes.push(
        <p key={key++} className={bodyClassName}>
          {parsed.text}
        </p>
      );
    }

    return nodes.length > 0 ? nodes : (
      <p className={bodyClassName}>{flat}</p>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-theme-card border border-theme rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-bold text-theme-accent mb-4">
          About {company.name || "the Company"}
        </h2>
        <div className="overflow-y-auto pr-1 space-y-0.5">
          {formatAboutCompany(company["About The Company"])}
        </div>
      </div>
    </div>
  );
}

export default AboutTab;

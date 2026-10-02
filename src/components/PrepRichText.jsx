import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeMarkdownForDisplay } from "../utils/normalizeMarkdownForDisplay.js";

const VARIANT_CLASS = {
  dark: {
    root: "text-slate-300 leading-relaxed",
    p: "mb-3 last:mb-0",
    strong: "font-semibold text-slate-100",
    em: "italic text-slate-200",
    h1: "text-lg font-bold text-slate-100 mt-4 mb-2 first:mt-0",
    h2: "text-base font-bold text-slate-100 mt-4 mb-2 first:mt-0",
    h3: "text-sm font-bold text-slate-100 mt-3 mb-1.5 first:mt-0",
    ul: "list-disc mb-3 space-y-2 pl-6",
    ol: "mb-3 space-y-2",
    li: "text-slate-300",
    codeInline: "rounded bg-slate-900/80 px-1.5 py-0.5 text-[0.85em] font-mono text-indigo-200",
    pre: "mb-3 overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs sm:text-sm",
    tableWrap: "mb-4 overflow-x-auto rounded-lg border border-slate-700",
    table: "min-w-full border-collapse text-left text-sm",
    th: "border-b border-slate-600 bg-slate-900/80 px-3 py-2 font-semibold text-slate-100",
    td: "border-b border-slate-700/80 px-3 py-2 align-top text-slate-300",
  },
  theme: {
    root: "text-theme-secondary leading-relaxed",
    p: "mb-3 last:mb-0",
    strong: "font-semibold text-theme-primary",
    em: "italic text-theme-secondary",
    h1: "text-lg font-bold text-theme-primary mt-4 mb-2 first:mt-0",
    h2: "text-base font-bold text-theme-primary mt-4 mb-2 first:mt-0",
    h3: "text-sm font-bold text-theme-primary mt-3 mb-1.5 first:mt-0",
    ul: "list-disc mb-3 space-y-2 pl-6",
    ol: "mb-3 space-y-2",
    li: "text-theme-secondary",
    codeInline: "rounded bg-theme-input px-1.5 py-0.5 text-[0.85em] font-mono text-theme-accent",
    pre: "mb-3 overflow-x-auto rounded-lg border border-theme bg-theme-input p-3 text-xs sm:text-sm",
    tableWrap: "mb-4 overflow-x-auto rounded-lg border border-theme",
    table: "min-w-full border-collapse text-left text-sm",
    th: "border-b border-theme bg-theme-hero/50 px-3 py-2 font-semibold text-theme-primary",
    td: "border-b border-theme px-3 py-2 align-top text-theme-secondary",
  },
};

/**
 * Markdown answers: bold, lists, GFM tables, fenced code blocks.
 */
export default function PrepRichText({ children, variant = "dark", className = "" }) {
  const text = normalizeMarkdownForDisplay(String(children ?? ""));
  if (!text) return null;
  const v = VARIANT_CLASS[variant] || VARIANT_CLASS.dark;

  return (
    <div className={`prep-rich-text max-w-none text-sm sm:text-base ${v.root} ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children: c }) => <p className={v.p}>{c}</p>,
          strong: ({ children: c }) => <strong className={v.strong}>{c}</strong>,
          em: ({ children: c }) => <em className={v.em}>{c}</em>,
          h1: ({ children: c }) => <h3 className={v.h1}>{c}</h3>,
          h2: ({ children: c }) => <h3 className={v.h2}>{c}</h3>,
          h3: ({ children: c }) => <h4 className={v.h3}>{c}</h4>,
          ul: ({ children: c }) => <ul className={v.ul}>{c}</ul>,
          ol: ({ children: c }) => (
            <ol className={`${v.ol} list-decimal pl-6 [list-style-position:outside] space-y-2`}>
              {c}
            </ol>
          ),
          li: ({ children: c }) => <li className={`${v.li} leading-relaxed`}>{c}</li>,
          code: ({ inline, className: codeClass, children: c }) =>
            inline ? (
              <code className={v.codeInline}>{c}</code>
            ) : (
              <code className={`block font-mono whitespace-pre-wrap ${codeClass || ""}`}>{c}</code>
            ),
          pre: ({ children: c }) => <pre className={v.pre}>{c}</pre>,
          table: ({ children: c }) => (
            <div className={v.tableWrap}>
              <table className={v.table}>{c}</table>
            </div>
          ),
          thead: ({ children: c }) => <thead>{c}</thead>,
          tbody: ({ children: c }) => <tbody>{c}</tbody>,
          tr: ({ children: c }) => <tr>{c}</tr>,
          th: ({ children: c }) => <th className={v.th}>{c}</th>,
          td: ({ children: c }) => <td className={v.td}>{c}</td>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

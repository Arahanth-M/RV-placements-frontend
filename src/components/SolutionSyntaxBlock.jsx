import { useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "../utils/ThemeContext";
import { inferSolutionLanguage } from "../utils/inferSolutionLanguage";
import { preserveStoredSourceForDisplay } from "../utils/prepareSourceCodeForDisplay.js";

/**
 * VS Code–style syntax highlighting for solution bodies.
 * Outer chrome (borders / section chrome) should be applied by the parent; this
 * only styles the editor surface (#1e1e1e dark / VS light).
 *
 * Indentation: global `pre, code { white-space: pre-wrap }` in index.css must not
 * collapse or reflow source — see `.solution-syntax-root` overrides in index.css.
 */
export default function SolutionSyntaxBlock({
  code,
  toolbar = null,
  className = "",
  language,
}) {
  const { theme } = useTheme();
  const rootRef = useRef(null);
  const style = theme === "dark" ? vscDarkPlus : vs;
  const stored = preserveStoredSourceForDisplay(code);
  const lang =
    typeof language === "string" && language.trim()
      ? language.trim()
      : inferSolutionLanguage(stored);
  // Keep spaces/indent exactly as stored (no reflow/re-indent).
  const displayCode = stored;

  useEffect(() => {
    if (!import.meta.env.DEV || !rootRef.current) return;
    const pre = rootRef.current.querySelector("pre, .solution-syntax-pre");
    const codeEl = rootRef.current.querySelector("code");
    if (!pre || !codeEl) return;
    const rendered = codeEl.textContent || "";
    const source = String(displayCode ?? "");
    if (rendered.replace(/\r\n/g, "\n") !== source.replace(/\r\n/g, "\n")) {
      const preStyle = getComputedStyle(pre);
      const codeStyle = getComputedStyle(codeEl);
      // Temporary diagnostic for indentation regressions (dev only).
      console.warn("[SolutionSyntaxBlock] rendered textContent differs from source", {
        language: lang,
        sourceLen: source.length,
        renderedLen: rendered.length,
        preWhiteSpace: preStyle.whiteSpace,
        codeWhiteSpace: codeStyle.whiteSpace,
        preTabSize: preStyle.tabSize,
        codeTabSize: codeStyle.tabSize,
      });
    }
  }, [displayCode, lang, theme]);

  return (
    <div
      ref={rootRef}
      className={`solution-syntax-root relative max-w-full min-w-0 ${className}`}
    >
      {toolbar ? (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">{toolbar}</div>
      ) : null}
      <SyntaxHighlighter
        language={lang}
        style={style}
        showLineNumbers={false}
        PreTag="pre"
        wrapLongLines={false}
        className="solution-syntax-pre"
        customStyle={{
          margin: 0,
          paddingTop: toolbar ? "2.75rem" : "0.75rem",
          paddingRight: "0.75rem",
          paddingBottom: "0.75rem",
          paddingLeft: "0.75rem",
          borderRadius: "0.5rem",
          fontSize: "clamp(0.7rem, 2.8vw, 0.875rem)",
          lineHeight: 1.55,
          maxWidth: "100%",
          overflowX: "auto",
          border: "none",
          background: theme === "dark" ? "#1e1e1e" : "#f8f8f8",
          color: theme === "dark" ? "#d4d4d4" : "#24292e",
          whiteSpace: "pre",
          tabSize: 4,
          MozTabSize: 4,
        }}
        codeTagProps={{
          className: "solution-syntax-code",
          style: {
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
            whiteSpace: "pre",
            tabSize: 4,
            MozTabSize: 4,
            wordBreak: "normal",
            overflowWrap: "normal",
            display: "block",
          },
        }}
      >
        {displayCode}
      </SyntaxHighlighter>
    </div>
  );
}

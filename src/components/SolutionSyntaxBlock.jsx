import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "../utils/ThemeContext";
import { inferSolutionLanguage } from "../utils/inferSolutionLanguage";

/**
 * VS Code–style syntax highlighting for solution bodies.
 * Outer chrome (borders / section chrome) should be applied by the parent; this
 * only styles the editor surface (#1e1e1e dark / VS light).
 */
export default function SolutionSyntaxBlock({ code, toolbar = null, className = "" }) {
  const { theme } = useTheme();
  const style = theme === "dark" ? vscDarkPlus : vs;
  const lang = inferSolutionLanguage(String(code ?? ""));

  return (
    <div className={`solution-syntax-root relative max-w-full min-w-0 ${className}`}>
      {toolbar ? (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">{toolbar}</div>
      ) : null}
      <SyntaxHighlighter
        language={lang}
        style={style}
        showLineNumbers={false}
        PreTag="div"
        wrapLongLines
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
          border: "none",
          ...(theme === "dark" ? { background: "#1e1e1e" } : {}),
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
          },
        }}
      >
        {String(code ?? "")}
      </SyntaxHighlighter>
    </div>
  );
}

import React, { useMemo, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { defaultKeymap } from "@codemirror/commands";
import {
  bracketMatching,
  defaultHighlightStyle,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { oneDark } from "@codemirror/theme-one-dark";
import { useTheme } from "../../utils/ThemeContext";

function languageExtension(language) {
  const l = String(language || "python").toLowerCase();
  if (l === "cpp" || l === "c++") return cpp();
  if (l === "java") return java();
  return python();
}

const editorLightChrome = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--input-bg)",
      color: "var(--text-primary)",
    },
    ".cm-scroller": {
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
    ".cm-content": { caretColor: "var(--accent)" },
    ".cm-gutters": {
      backgroundColor: "var(--bg-card)",
      color: "var(--text-muted)",
      border: "none",
      borderRight: "1px solid var(--input-border)",
    },
    ".cm-activeLineGutter": { backgroundColor: "transparent" },
    "&.cm-focused .cm-cursor": { borderLeftColor: "var(--accent)" },
    "&.cm-focused .cm-selectionBackground, &::selection .cm-selectionBackground, .cm-selectionBackground": {
      background: "rgba(99, 102, 241, 0.22) !important",
    },
    ".cm-activeLine": { backgroundColor: "rgba(99, 102, 241, 0.06)" },
  },
  { dark: false }
);

const editorEmbeddedChrome = EditorView.theme(
  {
    "&": {
      backgroundColor: "transparent",
      color: "var(--text-primary)",
      height: "100%",
    },
    ".cm-scroller": {
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      overflow: "auto",
    },
    ".cm-content": { caretColor: "var(--accent)" },
    ".cm-gutters": {
      backgroundColor: "color-mix(in srgb, var(--input-bg) 85%, #000 15%)",
      color: "var(--text-muted)",
      border: "none",
      borderRight: "1px solid var(--input-border)",
    },
    ".cm-activeLineGutter": { backgroundColor: "transparent" },
    "&.cm-focused .cm-cursor": { borderLeftColor: "var(--accent)" },
    "&.cm-focused .cm-selectionBackground, &::selection .cm-selectionBackground, .cm-selectionBackground": {
      background: "rgba(99, 102, 241, 0.22) !important",
    },
    ".cm-activeLine": { backgroundColor: "rgba(99, 102, 241, 0.06)" },
  },
  { dark: false }
);

/**
 * IDE-style editor for mock interview coding answers (syntax-highlighted; theme follows app light/dark).
 */
export default function InterviewCodeWorkspace({
  value,
  onChange,
  disabled,
  language = "python",
  placeholder = "// Write your solution here…",
  minHeightPx = 280,
  onSubmitShortcut,
  embedded = false,
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const extensions = useMemo(() => {
    const lang = languageExtension(language);
    const submitMap =
      typeof onSubmitShortcut === "function"
        ? keymap.of([
            {
              key: "Mod-Enter",
              preventDefault: true,
              run: () => {
                onSubmitShortcut();
                return true;
              },
            },
          ])
        : null;

    const base = [
      EditorState.tabSize.of(2),
      indentUnit.of("  "),
      lang,
      lineNumbers(),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([indentWithTab, ...defaultKeymap]),
      isDark ? oneDark : embedded ? editorEmbeddedChrome : editorLightChrome,
    ];
    if (submitMap) base.push(submitMap);
    return base;
  }, [language, isDark, onSubmitShortcut, embedded]);

  const onChangeDoc = useCallback(
    (doc) => {
      onChange(doc);
    },
    [onChange]
  );

  if (embedded) {
    return (
      <div className="icp-codemirror-embedded h-full min-h-[220px] flex flex-col">
        <CodeMirror
          value={value}
          height={`${Math.max(220, minHeightPx)}px`}
          theme={isDark ? "dark" : "light"}
          extensions={extensions}
          onChange={onChangeDoc}
          editable={!disabled}
          placeholder={placeholder}
          basicSetup={false}
          className="text-[13px] leading-[1.55] flex-1 min-h-[220px] [&_.cm-editor]:min-h-[220px] [&_.cm-scroller]:min-h-[220px]"
          aria-label="Coding interview solution"
        />
      </div>
    );
  }

  return (
    <div className="ai-code-workspace rounded-xl overflow-hidden border border-theme-input shadow-inner">
      <div className="ai-code-workspace-toolbar flex items-center justify-between gap-3 px-3 py-2 border-b border-theme-input bg-theme-card">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-theme-muted shrink-0">
            Solution
          </span>
          <span className="hidden sm:inline text-xs text-theme-secondary truncate">
            Syntax highlighting · Tab inserts two spaces · Ctrl+Enter submits
          </span>
        </div>
      </div>

      <div
        className="ai-interview-codemirror-host relative max-h-[min(52vh,520px)] min-h-[280px] overflow-hidden"
        style={{ minHeight: `${minHeightPx}px` }}
      >
        <CodeMirror
          value={value}
          height="min(52vh, 520px)"
          theme={isDark ? "dark" : "light"}
          extensions={extensions}
          onChange={onChangeDoc}
          editable={!disabled}
          placeholder={placeholder}
          basicSetup={false}
          className="text-[13px] leading-[1.55]"
          aria-label="Coding interview solution"
        />
      </div>
    </div>
  );
}

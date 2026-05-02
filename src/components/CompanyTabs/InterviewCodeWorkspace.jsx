import React, { useMemo, useRef, useEffect, useCallback } from "react";

/**
 * IDE-style editor for mock interview coding answers (single text blob submitted as answer).
 * Styling uses theme CSS variables via .ai-code-workspace-* classes in index.css.
 */
export default function InterviewCodeWorkspace({
  value,
  onChange,
  disabled,
  placeholder = "// Write your solution here…",
  minHeightPx = 280,
  onSubmitShortcut,
}) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);

  const lineCount = useMemo(() => {
    const text = String(value ?? "");
    if (!text) return 1;
    return text.split("\n").length;
  }, [value]);

  const gutterLines = useMemo(
    () => Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1),
    [lineCount]
  );

  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const g = gutterRef.current;
    if (ta && g) {
      g.scrollTop = ta.scrollTop;
    }
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(minHeightPx, ta.scrollHeight)}px`;
    syncScroll();
  }, [value, minHeightPx, syncScroll]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmitShortcut?.();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const next =
        String(value ?? "").slice(0, start) + "  " + String(value ?? "").slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.selectionStart = el.selectionEnd = start + 2;
        }
      });
    }
  };

  return (
    <div className="ai-code-workspace rounded-xl overflow-hidden border border-theme-input shadow-inner">
      <div className="ai-code-workspace-toolbar flex items-center justify-between gap-3 px-3 py-2 border-b border-theme-input bg-theme-card">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-theme-muted shrink-0">
            Solution
          </span>
          <span className="hidden sm:inline text-xs text-theme-secondary truncate">
            Monospace editor · Tab inserts two spaces
          </span>
        </div>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md ai-code-workspace-pill">
          Pseudocode OK
        </span>
      </div>

      <div className="relative flex ai-code-workspace-body max-h-[min(52vh,520px)] min-h-[280px]">
        <div
          ref={gutterRef}
          className="ai-code-workspace-gutter shrink-0 overflow-hidden select-none text-right py-3 pr-2 pl-2"
          aria-hidden
        >
          {gutterLines.map((n) => (
            <div key={`ln-${n}`} className="ai-code-workspace-gutter-line leading-[1.55]">
              {n}
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          className="ai-code-workspace-editor flex-1 min-h-[280px] max-h-[min(52vh,520px)] w-full py-3 pr-3 resize-none border-0 bg-transparent focus:outline-none focus:ring-0 overflow-y-auto"
          aria-label="Coding interview solution"
        />
      </div>
    </div>
  );
}

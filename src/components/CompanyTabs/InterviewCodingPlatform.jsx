import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaChevronDown, FaInfoCircle, FaPlay, FaSpinner, FaTimes } from "react-icons/fa";
import {
  buildCppStubFromInterviewDraft,
  getCodingRunnerContractHints,
  getCppGraderContractHints,
  resolvePythonInterviewStub,
} from "../../utils/cppInterviewStub";
import { getJavaGraderContractHints } from "../../utils/javaInterviewStub";
import InterviewCodeWorkspace from "./InterviewCodeWorkspace";
import "./InterviewCodingPlatform.css";

function formatTestValue(value) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
}

function capitalizeDifficulty(value) {
  const s = String(value || "medium").trim().toLowerCase();
  if (!s) return "Medium";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Split question into display text and optional constraints block (no title/body split). */
export function parseCodingQuestionLayout(questionText) {
  const raw = String(questionText || "").trim();
  if (!raw) {
    return { displayText: "", constraintsFromText: [] };
  }

  let displayText = raw;
  const constraintsMatch = raw.match(/\n(?:constraints?)\s*:?\s*\n([\s\S]*)$/i);
  let constraintsFromText = [];
  if (constraintsMatch) {
    displayText = raw.slice(0, constraintsMatch.index).trim();
    constraintsFromText = constraintsMatch[1]
      .split("\n")
      .map((line) => line.replace(/^[\s•\-*]+/, "").trim())
      .filter(Boolean);
  }

  return { displayText: displayText || raw, constraintsFromText };
}

function resolveStarterCodeDisplay(
  starterCode,
  language,
  functionSignature,
  sampleInput,
  sampleExpected
) {
  const lang = String(language || "python").trim().toLowerCase();

  if (starterCode != null && typeof starterCode === "object" && !Array.isArray(starterCode)) {
    const byLang =
      starterCode[lang] ?? starterCode.python ?? starterCode.cpp ?? starterCode.java ?? "";
    if (String(byLang || "").trim()) return String(byLang).trim();
  }

  const rawStarter = String(starterCode || "").trim();
  if (rawStarter && lang === "python") return rawStarter;
  if (rawStarter && lang !== "python" && !/\bdef\s+\w+\s*\(/.test(rawStarter)) {
    return rawStarter;
  }

  if (lang === "python") {
    return resolvePythonInterviewStub(starterCode, functionSignature);
  }
  if (lang === "cpp") {
    return buildCppStubFromInterviewDraft(functionSignature, sampleInput, sampleExpected);
  }
  if (lang === "java") {
    const hints = getJavaGraderContractHints(functionSignature, sampleInput, sampleExpected);
    if (hints.kind === "design") {
      return `public class ${hints.designClassName} {\n    // implement design operations\n}\n`;
    }
    if (hints.kind === "function") {
      return `public class Solution {\n    ${hints.classMethodDecl} {\n        // TODO\n    }\n}\n`;
    }
  }

  return rawStarter;
}

function InterviewCodingRulesModal({
  open,
  onClose,
  codingFunctionSignature,
  codingStarterCode,
  language,
  visibleTestCases,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const sampleInput = visibleTestCases?.[0]?.input;
  const sampleExpected = visibleTestCases?.[0]?.expectedOutput;

  const codingContractHints = useMemo(
    () => getCodingRunnerContractHints(codingFunctionSignature),
    [codingFunctionSignature]
  );
  const cppGraderContractHints = useMemo(
    () => getCppGraderContractHints(codingFunctionSignature, sampleInput, sampleExpected),
    [codingFunctionSignature, sampleInput, sampleExpected]
  );
  const javaGraderContractHints = useMemo(
    () => getJavaGraderContractHints(codingFunctionSignature, sampleInput, sampleExpected),
    [codingFunctionSignature, sampleInput, sampleExpected]
  );
  const starterCodeDisplay = useMemo(
    () =>
      resolveStarterCodeDisplay(
        codingStarterCode,
        language,
        codingFunctionSignature,
        sampleInput,
        sampleExpected
      ),
    [codingStarterCode, language, codingFunctionSignature, sampleInput, sampleExpected]
  );

  if (!open) return null;

  const designClassName =
    codingContractHints?.designClassName ||
    cppGraderContractHints?.designClassName ||
    javaGraderContractHints?.designClassName;

  return (
    <div
      className="icp-rules-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="icp-rules-modal-title"
      onClick={onClose}
    >
      <div className="icp-rules-modal" onClick={(e) => e.stopPropagation()}>
        <div className="icp-rules-modal-header">
          <h2 id="icp-rules-modal-title" className="icp-rules-modal-title">
            Platform rules &amp; grader
          </h2>
          <button
            type="button"
            className="icp-rules-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes aria-hidden />
          </button>
        </div>

        <div className="icp-rules-modal-body">
          <section className="icp-rules-section icp-rules-section-accent">
            <p className="icp-rules-section-title">Sandbox rules</p>
            <ul className="icp-rules-list">
              <li>
                Do not use <code>input()</code>, <code>print()</code>, or <code>solve()</code> as
                your answer mechanism — grading uses return values.{" "}
                <span className="icp-rules-muted">
                  (Optional: <code>print</code> / <code>System.out</code> output from visible
                  preview runs appears in the test panel.)
                </span>
              </li>
              <li>
                For Java, do not add <code>main</code>, <code>Scanner</code>, or{" "}
                <code>System.in</code> — the runner calls your <code>Solution</code> method directly.
              </li>
              <li>
                The platform passes testcase inputs and compares your return value to the expected
                output — you do not read stdin or print the answer.
              </li>
              <li>
                Each DSA (coding) round asks at most 2 coding questions per interview. Each HR
                round asks exactly 1 behavioral question.
              </li>
            </ul>
          </section>

          <section className="icp-rules-section">
            <p className="icp-rules-section-title">Grader contract</p>
            {String(codingFunctionSignature || "").trim() ? (
              <p className="icp-rules-paragraph">
                <span className="icp-rules-muted">Signature from question bank: </span>
                <code className="icp-rules-code-block">{String(codingFunctionSignature).trim()}</code>
              </p>
            ) : (
              <p className="icp-rules-muted">No function signature on this question yet.</p>
            )}

            {codingContractHints?.kind === "design" ||
            cppGraderContractHints?.kind === "design" ||
            javaGraderContractHints?.kind === "design" ? (
              <p className="icp-rules-paragraph">
                Design problem: implement <code className="icp-rules-inline-code">class {designClassName}</code>{" "}
                and the operations described in the prompt. Tests use a command sequence (see visible
                cases).
              </p>
            ) : null}

            {codingContractHints?.kind === "function" ? (
              <div className="icp-rules-lang-block">
                <p className="icp-rules-lang-label">Python</p>
                <p className="icp-rules-paragraph">
                  <span className="icp-rules-muted">Top-level (preferred): </span>
                  <code className="icp-rules-code-block">{codingContractHints.defLine}</code>
                </p>
                <p className="icp-rules-paragraph">
                  <span className="icp-rules-muted">Or </span>
                  <code className="icp-rules-inline-code">class Solution</code>
                  <span className="icp-rules-muted"> with a method named one of: </span>
                  <code className="icp-rules-inline-code">
                    {codingContractHints.solutionMethodCandidates.join(", ")}
                  </code>
                </p>
              </div>
            ) : null}

            {cppGraderContractHints?.kind === "function" ? (
              <div className="icp-rules-lang-block">
                <p className="icp-rules-lang-label">C++</p>
                <p className="icp-rules-paragraph">
                  <span className="icp-rules-muted">Free function (bridge — keep as generated): </span>
                  <code className="icp-rules-code-block">{cppGraderContractHints.freeFunctionDecl}</code>
                </p>
                <p className="icp-rules-paragraph">
                  <span className="icp-rules-muted">Implement inside </span>
                  <code className="icp-rules-inline-code">class Solution</code>
                  <span className="icp-rules-muted"> as: </span>
                  <code className="icp-rules-code-block">{cppGraderContractHints.classMethodDecl}</code>
                </p>
                <p className="icp-rules-muted">
                  Method name in <code className="icp-rules-inline-code">Solution</code> is{" "}
                  <code className="icp-rules-inline-code">{cppGraderContractHints.solutionMethodName}</code>.
                </p>
              </div>
            ) : null}

            {javaGraderContractHints?.kind === "function" ? (
              <div className="icp-rules-lang-block">
                <p className="icp-rules-lang-label">Java</p>
                <p className="icp-rules-paragraph">
                  <span className="icp-rules-muted">Implement inside </span>
                  <code className="icp-rules-inline-code">public class Solution</code>
                  <span className="icp-rules-muted"> as: </span>
                  <code className="icp-rules-code-block">{javaGraderContractHints.classMethodDecl}</code>
                </p>
                <p className="icp-rules-muted">
                  Method name is{" "}
                  <code className="icp-rules-inline-code">{javaGraderContractHints.solutionMethodName}</code>.
                </p>
              </div>
            ) : null}

            <div className="icp-rules-footnotes">
              <p>
                <span className="icp-rules-footnote-label">Python: </span>
                tests compare with <code>==</code> — types, nesting, and list order must match the
                expected JSON (e.g. <code>None</code> ≠ missing).
              </p>
              <p>
                <span className="icp-rules-footnote-label">C++: </span>
                the harness serializes your return value to JSON and compares to expected output the
                same way; prefer exact structural match.
              </p>
              <p>
                <span className="icp-rules-footnote-label">Java: </span>
                same JSON comparison after serializing your return value; use{" "}
                <code>public class Solution</code> and do not add <code>main</code> — the sandbox
                calls your method directly.
              </p>
            </div>
          </section>

          <section className="icp-rules-section">
            <p className="icp-rules-section-title">Starter code ({String(language || "python")})</p>
            {starterCodeDisplay ? (
              <pre className="icp-rules-starter-code">
                <code>{starterCodeDisplay}</code>
              </pre>
            ) : (
              <p className="icp-rules-muted">No starter code for this question.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function RichProblemText({ text }) {
  if (!text) return null;
  const parts = String(text).split(/(`[^`\n]+`)/g);
  return (
    <span className="icp-problem-body">
      {parts.map((part, idx) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={`code-${idx}`} className="icp-inline-code">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={`txt-${idx}`}>{part}</span>;
      })}
    </span>
  );
}

function InterviewCodingTestPanel({
  visibleTestCases,
  execution,
  loading,
  hints,
  hiddenCount = 0,
  collapsed,
  onToggleCollapsed,
}) {
  const visibleResults = useMemo(() => {
    if (!execution || !Array.isArray(execution.results)) return [];
    return execution.results.filter((r) => r && r.isHidden !== true);
  }, [execution]);

  const visiblePassed = visibleResults.filter((r) => r.passed).length;

  return (
    <div className={`icp-test-panel${collapsed ? " collapsed" : ""}`}>
      <div className="icp-test-header">
        <span className="icp-test-header-title">Test cases</span>
        <span className="icp-test-tab active">
          Visible ({Array.isArray(visibleTestCases) ? visibleTestCases.length : 0})
        </span>
        {hiddenCount > 0 ? (
          <span className="icp-test-tab">Hidden ({hiddenCount})</span>
        ) : (
          <span className="icp-test-tab">Hidden</span>
        )}
        <button
          type="button"
          className="icp-hdivider-btn ms-auto"
          aria-label={collapsed ? "Expand test cases" : "Collapse test cases"}
          onClick={onToggleCollapsed}
        >
          <FaChevronDown
            style={{ transform: collapsed ? "rotate(180deg)" : "none", width: "0.65rem" }}
            aria-hidden
          />
        </button>
      </div>

      {!collapsed ? (
        <>
          {loading ? (
            <p className="icp-test-run-summary flex items-center gap-2">
              <FaSpinner className="animate-spin shrink-0" aria-hidden />
              Running tests…
            </p>
          ) : null}

          <div className="icp-test-list">
            {Array.isArray(visibleTestCases) && visibleTestCases.length > 0 ? (
              visibleTestCases.map((testcase, idx) => {
                const runRow = visibleResults[idx];
                const ran = Boolean(runRow);
                const passed = Boolean(runRow?.passed);
                return (
                  <div
                    key={`icp-test-${idx}`}
                    className={`icp-test-row${ran ? (passed ? " pass" : " fail") : ""}`}
                  >
                    <div className="icp-test-row-main">
                      <p className="icp-test-row-label">Case {idx + 1}</p>
                      <p className="icp-test-row-input">{formatTestValue(testcase?.input)}</p>
                      {ran && !passed ? (
                        <p className="icp-test-row-input mt-1">
                          Expected: {formatTestValue(runRow?.expectedOutput ?? testcase?.expectedOutput)}
                        </p>
                      ) : null}
                      {ran && runRow?.error ? (
                        <p className="icp-test-row-input mt-1 text-[#f87171]">
                          {runRow.error}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`icp-test-status${ran ? (passed ? " pass" : " fail") : ""}`}
                    >
                      {ran ? (passed ? "Passed" : "Failed") : "Not run"}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="icp-test-run-summary">No visible test cases yet.</p>
            )}
          </div>

          {execution && !loading && visibleResults.length > 0 ? (
            <p className="icp-test-run-summary">
              Visible:{" "}
              <strong>
                {visiblePassed}/{visibleResults.length} passed
              </strong>
              {hints?.summary ? ` · ${hints.summary}` : null}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/**
 * LeetCode-style split coding workspace for AI mock interview DSA rounds.
 */
export default function InterviewCodingPlatform({
  questionText,
  questionTypingIncomplete = false,
  questionUrl = "",
  difficulty = "medium",
  roundType = "DSA",
  questionNumber = 1,
  questionsInRound = 2,
  visibleTestCases = [],
  complexity = null,
  codingFunctionSignature = "",
  codingStarterCode = "",
  answerCode,
  onAnswerCodeChange,
  language,
  languageOptions = [],
  onLanguageChange,
  onRun,
  onSubmit,
  canSubmit = false,
  runLoading = false,
  submitLoading = false,
  disabled = false,
  placeholder = "",
  onSubmitShortcut,
  previewExecution = null,
  previewLoading = false,
  previewHints = null,
  previewRunInlineHint = "",
  onDismissPreviewHint,
  leftPaneWidth = 400,
  paneWrapRef,
  splitDragRef,
  onLeftPaneWidthChange,
}) {
  const [testPanelCollapsed, setTestPanelCollapsed] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  const layout = useMemo(() => parseCodingQuestionLayout(questionText), [questionText]);

  const constraints = useMemo(() => {
    const items = [...layout.constraintsFromText];
    if (complexity?.time) {
      items.push(`Expected time: ${String(complexity.time).trim()}`);
    }
    if (complexity?.space) {
      items.push(`Expected space: ${String(complexity.space).trim()}`);
    }
    return items;
  }, [layout.constraintsFromText, complexity]);

  const examples = useMemo(() => {
    if (!Array.isArray(visibleTestCases) || visibleTestCases.length === 0) return [];
    return visibleTestCases.slice(0, 3).map((tc, idx) => ({
      key: `ex-${idx}`,
      input: formatTestValue(tc?.input),
      output: formatTestValue(tc?.expectedOutput),
    }));
  }, [visibleTestCases]);

  const hiddenCount = useMemo(() => {
    if (!previewExecution?.results) return 0;
    return previewExecution.results.filter((r) => r?.isHidden === true).length;
  }, [previewExecution]);

  const handleSplitMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      if (splitDragRef?.current) {
        splitDragRef.current.active = true;
        splitDragRef.current.startX = e.clientX;
        splitDragRef.current.startW = leftPaneWidth;
      }
    },
    [splitDragRef, leftPaneWidth]
  );

  useEffect(() => {
    if (!splitDragRef) return undefined;
    const onMove = (e) => {
      const d = splitDragRef.current;
      if (!d?.active || !paneWrapRef?.current || typeof onLeftPaneWidthChange !== "function") {
        return;
      }
      const rect = paneWrapRef.current.getBoundingClientRect();
      const maxLeft = Math.max(260, rect.width - 280);
      const next = Math.max(240, Math.min(maxLeft, d.startW + (e.clientX - d.startX)));
      onLeftPaneWidthChange(next);
    };
    const onUp = () => {
      if (splitDragRef.current) splitDragRef.current.active = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [splitDragRef, paneWrapRef, onLeftPaneWidthChange]);

  const roundBadge = String(roundType || "DSA").trim() || "DSA";

  return (
    <div
      ref={paneWrapRef}
      className="icp-root w-full min-w-0"
      style={{ "--icp-split-left": `${leftPaneWidth}px` }}
    >
      <div className="icp-split">
        {/* Left — problem */}
        <aside className="icp-problem-pane">
          <div className="icp-problem-header">
            <div className="icp-problem-badges">
              <span className="icp-badge icp-badge-medium">{capitalizeDifficulty(difficulty)}</span>
              <span className="icp-badge icp-badge-round">{roundBadge}</span>
            </div>
            <div className="icp-problem-header-actions">
              <button
                type="button"
                className="icp-rules-btn"
                onClick={() => setRulesModalOpen(true)}
                aria-haspopup="dialog"
              >
                <FaInfoCircle aria-hidden />
                <span>Rules &amp; grader</span>
              </button>
              <span className="icp-question-progress">
                Q {questionNumber} of {questionsInRound}
              </span>
            </div>
          </div>

          {layout.displayText ? (
            <div className="icp-problem-text">
              <RichProblemText text={layout.displayText} />
              {questionTypingIncomplete ? (
                <span className="ai-interview-typewriter-caret" aria-hidden />
              ) : null}
            </div>
          ) : null}

          {questionUrl ? (
            <a
              href={questionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="icp-source-link"
            >
              View original problem
            </a>
          ) : null}

          {examples.length > 0 ? (
            <>
              <p className="icp-section-label">Examples</p>
              {examples.map((ex, idx) => (
                <div key={ex.key} className="icp-example-card">
                  <p className="icp-example-label">Example {idx + 1}</p>
                  <p className="icp-example-label mt-2">Input</p>
                  <p className="icp-example-value">{ex.input}</p>
                  <p className="icp-example-label mt-2">Output</p>
                  <p className="icp-example-value">{ex.output}</p>
                </div>
              ))}
            </>
          ) : null}

          {constraints.length > 0 ? (
            <>
              <p className="icp-section-label">Constraints</p>
              <ul className="icp-constraints-list">
                {constraints.map((item, idx) => (
                  <li key={`c-${idx}`} className="icp-constraint-item">
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </aside>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize problem and code panels"
          tabIndex={0}
          className="icp-split-drag hidden lg:block"
          onMouseDown={handleSplitMouseDown}
        />

        {/* Right — editor + tests */}
        <div className="icp-editor-column">
          <div className="icp-toolbar">
            <div className="icp-lang-wrap">
              {languageOptions.length > 1 ? (
                <>
                  <select
                    className="icp-lang-select"
                    value={language}
                    onChange={(e) => onLanguageChange?.(e.target.value)}
                    disabled={disabled}
                    aria-label="Coding language"
                  >
                    {languageOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="icp-lang-chevron" aria-hidden>
                    ▾▾
                  </span>
                </>
              ) : (
                <div className="icp-lang-select flex items-center">
                  {languageOptions[0]?.label || language}
                </div>
              )}
            </div>

            <div className="icp-toolbar-actions">
              <button
                type="button"
                className="icp-run-btn"
                onClick={onRun}
                disabled={runLoading || disabled}
                aria-label="Run code"
              >
                {runLoading ? (
                  <FaSpinner className="animate-spin" aria-hidden />
                ) : (
                  <FaPlay aria-hidden />
                )}
                <span>{runLoading ? "…" : "Run"}</span>
              </button>
              <button
                type="button"
                className="icp-submit-btn"
                onClick={onSubmit}
                disabled={!canSubmit}
              >
                {submitLoading ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>

          {previewRunInlineHint ? (
            <div className="icp-inline-hint flex items-start justify-between gap-2 mt-2">
              <span>{previewRunInlineHint}</span>
              {onDismissPreviewHint ? (
                <button
                  type="button"
                  onClick={onDismissPreviewHint}
                  className="shrink-0 text-theme-muted hover:text-theme-primary"
                  aria-label="Dismiss hint"
                >
                  ×
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="icp-editor-area">
            <div className="icp-code-host flex-1 min-h-0">
              <InterviewCodeWorkspace
                embedded
                value={answerCode}
                onChange={onAnswerCodeChange}
                disabled={disabled}
                language={language}
                placeholder={placeholder}
                onSubmitShortcut={onSubmitShortcut}
                minHeightPx={220}
              />
            </div>
          </div>

          <div className="icp-hdivider" aria-hidden>
            <button
              type="button"
              className="icp-hdivider-btn"
              aria-label={testPanelCollapsed ? "Expand test cases" : "Collapse test cases"}
              onClick={() => setTestPanelCollapsed((v) => !v)}
            >
              <FaChevronDown
                style={{ transform: testPanelCollapsed ? "rotate(180deg)" : "none", width: "0.65rem" }}
              />
            </button>
          </div>

          <InterviewCodingTestPanel
            visibleTestCases={visibleTestCases}
            execution={previewExecution}
            loading={previewLoading}
            hints={previewHints}
            hiddenCount={hiddenCount}
            collapsed={testPanelCollapsed}
            onToggleCollapsed={() => setTestPanelCollapsed((v) => !v)}
          />
        </div>
      </div>

      <InterviewCodingRulesModal
        open={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        codingFunctionSignature={codingFunctionSignature}
        codingStarterCode={codingStarterCode}
        language={language}
        visibleTestCases={visibleTestCases}
      />
    </div>
  );
}

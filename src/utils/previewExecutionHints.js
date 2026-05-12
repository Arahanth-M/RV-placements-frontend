/**
 * Human-readable hints for interview "Run code" / Run query preview results (rule-based, no LLM).
 */

const MAX_HINTS = 8;
const MAX_ERR_SNIP = 420;

function truncate(s, max = MAX_ERR_SNIP) {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function jsonKind(v) {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number") {
    return Number.isFinite(v) && Math.round(v) === v ? "integer" : "number";
  }
  if (typeof v === "boolean") return "boolean";
  if (typeof v === "string") return "string";
  if (typeof v === "object") return "object";
  return typeof v;
}

function shallowKeyDiff(expected, actual) {
  if (
    expected == null ||
    actual == null ||
    typeof expected !== "object" ||
    typeof actual !== "object" ||
    Array.isArray(expected) ||
    Array.isArray(actual)
  ) {
    return null;
  }
  const ek = new Set(Object.keys(expected));
  const ak = new Set(Object.keys(actual));
  const missing = [...ek].filter((k) => !ak.has(k));
  const extra = [...ak].filter((k) => !ek.has(k));
  return { missing, extra };
}

function hintFromRuntimeMessage(msg) {
  const m = String(msg || "").toLowerCase();
  if (!m) return "";
  if (m.includes("indentationerror") || m.includes("syntaxerror")) {
    return "Python reported a syntax/indentation error — check colons, indentation, and brackets.";
  }
  if (m.includes("nameerror") || m.includes("is not defined")) {
    return "A name is undefined at runtime — check spelling, imports, and that you only use names from the grader contract.";
  }
  if (m.includes("typeerror") || m.includes("unsupported operand")) {
    return "A type error occurred — check operand types (e.g. mixing list and int, or calling a non-function).";
  }
  if (m.includes("indexerror") || m.includes("list index out of range")) {
    return "Index out of range — verify loop bounds and empty-list edge cases.";
  }
  if (m.includes("keyerror")) {
    return "KeyError — a dict key is missing; confirm you use the parameter names and structure from the testcase input.";
  }
  if (m.includes("attributeerror")) {
    return "AttributeError — an object does not have the method or field you used.";
  }
  if (m.includes("recursionerror") || m.includes("maximum recursion depth")) {
    return "Recursion limit hit — check base cases and whether recursion depth can explode on large inputs.";
  }
  if (m.includes("zerodivisionerror") || m.includes("division by zero")) {
    return "Division by zero — guard denominators and edge cases.";
  }
  if (m.includes("timeout") || m.includes("timed out")) {
    return "Execution timed out — simplify work per testcase or fix infinite loops.";
  }
  return "";
}

function mismatchHintForCase(caseIndex, expected, actual, error) {
  const err = truncate(error, 360);
  if (err) {
    const extra = hintFromRuntimeMessage(err);
    return `Case ${caseIndex}: ${err}${extra ? ` — ${extra}` : ""}`;
  }

  const ke = jsonKind(expected);
  const ka = jsonKind(actual);
  if (ke !== ka) {
    return `Case ${caseIndex}: expected a ${ke} but your code returned a ${ka} (strict JSON comparison).`;
  }

  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) {
      return `Case ${caseIndex}: expected an array of length ${expected.length}, got length ${actual.length} (order and length must match).`;
    }
    return `Case ${caseIndex}: arrays have the same length but differ in elements or order — compare element-by-element with the expected output.`;
  }

  if (ke === "object" && ka === "object") {
    const diff = shallowKeyDiff(expected, actual);
    if (diff && (diff.missing.length || diff.extra.length)) {
      const parts = [];
      if (diff.missing.length) parts.push(`missing keys: ${diff.missing.slice(0, 6).join(", ")}`);
      if (diff.extra.length) parts.push(`extra keys: ${diff.extra.slice(0, 6).join(", ")}`);
      return `Case ${caseIndex}: object shape differs (${parts.join("; ")}).`;
    }
    return `Case ${caseIndex}: objects differ in nested values — expand expected vs actual in the preview below.`;
  }

  if (ke === "integer" || ke === "number") {
    return `Case ${caseIndex}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`;
  }

  if (ke === "boolean" || ke === "string" || ke === "null") {
    return `Case ${caseIndex}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`;
  }

  return `Case ${caseIndex}: output does not match expected (strict equality on JSON values).`;
}

function statusHintCoding(status, topError) {
  const s = String(status || "");
  const err = truncate(topError, 360);
  if (s === "EXECUTION_COMPILATION_ERROR") {
    return err
      ? `Compilation failed: ${err}`
      : "Compilation failed — fix syntax and ensure the selected language matches your code (Python vs C++).";
  }
  if (s === "EXECUTION_TIMEOUT") {
    return "Run timed out — check for infinite loops or very slow logic on the sample sizes.";
  }
  if (s === "EXECUTION_RUNTIME_ERROR") {
    return err ? `Runtime failure before all tests finished: ${err}` : "Runtime error while executing tests.";
  }
  if (s === "EXECUTION_ERROR") {
    if (err && /language is c\+\+/i.test(err)) return err;
    if (err && /language is python/i.test(err)) return err;
    return err || "Sandbox could not complete this run — check that your entrypoint matches the grader contract.";
  }
  return "";
}

/**
 * @param {Record<string, unknown> | null} execution
 * @returns {{ summary: string | null, hints: string[] }}
 */
export function buildPreviewCodeExecutionHints(execution) {
  if (!execution || typeof execution !== "object") {
    return { summary: null, hints: [] };
  }

  const status = String(execution.status || "");
  const topError = typeof execution.error === "string" ? execution.error : "";
  const results = Array.isArray(execution.results) ? execution.results : [];
  const passedCount = Number(execution.passedCount);
  const failedCount = Number(execution.failedCount);
  const totalCount = Number(execution.totalCount);

  const hints = [];

  const globalStatusHint = statusHintCoding(status, topError);
  if (globalStatusHint) hints.push(globalStatusHint);

  let visibleIndex = 0;
  for (let i = 0; i < results.length; i += 1) {
    const row = results[i];
    if (row?.isHidden) continue;
    visibleIndex += 1;
    if (row?.passed === true) continue;
    hints.push(mismatchHintForCase(visibleIndex, row?.expectedOutput, row?.actualOutput, row?.error));
  }

  const deduped = [];
  const seen = new Set();
  for (const h of hints) {
    const t = String(h || "").trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    deduped.push(t);
    if (deduped.length >= MAX_HINTS) break;
  }

  const allPassed =
    Number.isFinite(passedCount) &&
    Number.isFinite(totalCount) &&
    totalCount > 0 &&
    passedCount === totalCount &&
    failedCount === 0 &&
    status === "EXECUTION_SUCCESS";

  if (allPassed && deduped.length === 0) {
    return { summary: "All visible tests passed — you can submit when ready.", hints: [] };
  }

  if (deduped.length === 0 && Number.isFinite(totalCount) && totalCount === 0) {
    return {
      summary: "No tests were executed in this preview.",
      hints: [
        "If you expected testcase runs, check that visible testcases exist for this question and that your code defines the required function or class from the grader contract.",
      ],
    };
  }

  const summary =
    deduped.length > 0
      ? `What to fix (${Math.min(deduped.length, MAX_HINTS)} note${deduped.length === 1 ? "" : "s"}):`
      : null;

  return { summary, hints: deduped };
}

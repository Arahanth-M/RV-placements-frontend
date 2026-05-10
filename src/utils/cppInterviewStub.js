/**
 * Minimal C++ stub for mock-interview editor when the user switches from Python to C++.
 * Types mirror backend cppHarnessGenerator inference for common JSON testcase shapes.
 */

const parsePythonDefSignature = (functionSignature) => {
  const safe = typeof functionSignature === "string" ? functionSignature.trim() : "";
  const match = safe.match(/def\s+([A-Za-z_]\w*)\s*\(\s*([^)]*)\s*\)/);
  if (!match) return { name: "", params: [] };
  const rawParams = match[2].trim();
  if (!rawParams) return { name: match[1], params: [] };
  const params = rawParams
    .split(",")
    .map((segment) => {
      const part = String(segment || "").trim();
      if (!part) return "";
      const beforeType = part.split(":")[0]?.trim() || "";
      const beforeDefault = beforeType.split("=")[0]?.trim() || "";
      return beforeDefault;
    })
    .filter(Boolean);
  return { name: match[1], params };
};

/** Mirrors backend `parseTypescriptLikeSignature` (e.g. `lengthOfLongestSubstring(s: string) => number`). */
const parseTypescriptLikeSignature = (functionSignature) => {
  const safe = typeof functionSignature === "string" ? functionSignature.trim() : "";
  let m = safe.match(/^\s*function\s+([A-Za-z_]\w*)\s*\(\s*([^)]*)\s*\)/);
  if (!m) {
    m = safe.match(/^\s*([A-Za-z_]\w*)\s*\(\s*([^)]*)\s*\)\s*=>/);
  }
  if (!m) {
    m = safe.match(/^\s*([A-Za-z_]\w*)\s*\(\s*([^)]*)\s*\)\s*:/);
  }
  if (!m) {
    m = safe.match(/^\s*([A-Za-z_]\w*)\s*\(\s*([^)]*)\s*\)\s*$/);
  }
  if (!m) {
    return { name: "", params: [] };
  }
  const name = m[1];
  const rawParams = (m[2] || "").trim();
  if (!rawParams) {
    return { name, params: [] };
  }
  const params = rawParams
    .split(",")
    .map((segment) => {
      const part = String(segment || "").trim();
      if (!part) return "";
      const beforeType = part.split(":")[0]?.trim() || "";
      const beforeDefault = beforeType.split("=")[0]?.trim() || "";
      return beforeDefault;
    })
    .filter(Boolean);
  return { name, params };
};

const parseFlexibleInterviewSignature = (functionSignature) => {
  const py = parsePythonDefSignature(functionSignature);
  if (py.name) return py;
  return parseTypescriptLikeSignature(functionSignature);
};

const parseDesignClassNameFromSignature = (functionSignature) => {
  const safe = typeof functionSignature === "string" ? functionSignature.trim() : "";
  const m = safe.match(/\bclass\s+([A-Za-z_]\w*)\s*\{/);
  return m?.[1] || "";
};

/** When testcase JSON is not loaded yet, infer common DSA parameter C++ types from identifiers (keeps preview compiling). */
const inferCppTypeFromParamName = (name) => {
  const lower = String(name || "")
    .trim()
    .toLowerCase();
  if (!lower) return "int";
  const vectorish = new Set([
    "nums",
    "arr",
    "array",
    "prices",
    "heights",
    "values",
    "data",
    "cards",
    "numbers",
    "intervals",
    "queries",
    "edges",
    "times",
    "temperatures",
    "costs",
    "weights",
    "coins",
    "rolls",
  ]);
  if (vectorish.has(lower)) return "std::vector<int>";
  if (
    ["s", "str", "pattern", "text", "word", "t", "haystack", "needle", "jewels", "stones", "s1", "s2"].includes(lower)
  ) {
    return "std::string";
  }
  if (
    [
      "k",
      "n",
      "m",
      "target",
      "x",
      "val",
      "value",
      "key",
      "amount",
      "capacity",
      "day",
      "year",
      "limit",
      "budget",
      "w",
      "h",
    ].includes(lower)
  ) {
    return "int";
  }
  return "int";
};

const inferReturnHeuristic = (functionName, paramTypes) => {
  const f = String(functionName || "")
    .trim()
    .toLowerCase();
  if (f.includes("two_sum") || f.includes("three_sum") || f.includes("_indices")) return "std::vector<int>";
  if (f.includes("duplicate") || f.startsWith("is_") || f.includes("anagram") || f.includes("palindrome")) {
    return "bool";
  }
  if (
    f.includes("profit") ||
    f.includes("length") ||
    f.includes("distance") ||
    f.includes("water") ||
    f.includes("area") ||
    f.includes("coins") ||
    f.includes("rob") ||
    f.includes("paint") ||
    f.includes("decode") ||
    f.includes("jump") ||
    f.includes("erase") ||
    f.includes("remove") ||
    f.includes("search") ||
    f.includes("subarray")
  ) {
    return "int";
  }
  const vals = Object.values(paramTypes || {});
  if (vals.some((t) => String(t).includes("std::vector"))) return "int";
  return "int";
};

const inferCppTypeFromJson = (value, depth = 0) => {
  if (depth > 14) return "nlohmann::json";
  if (value === null || value === undefined) return "nlohmann::json";
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "double";
    if (Number.isInteger(value) && Math.abs(value) <= 2147483647) return "int";
    return "long long";
  }
  if (typeof value === "string") return "std::string";
  if (Array.isArray(value)) {
    if (value.length === 0) return "std::vector<int>";
    const inner = inferCppTypeFromJson(value[0], depth + 1);
    for (let i = 1; i < value.length; i += 1) {
      if (inferCppTypeFromJson(value[i], depth + 1) !== inner) return "nlohmann::json";
    }
    return `std::vector<${inner}>`;
  }
  if (typeof value === "object") return "nlohmann::json";
  return "nlohmann::json";
};

const includesForTypes = (cppType) => {
  const s = new Set(["#include <vector>"]);
  if (cppType.includes("std::string") || cppType === "std::string") s.add("#include <string>");
  return [...s].join("\n");
};

const defaultReturnSnippet = (returnType) => {
  if (returnType === "bool") return "false";
  if (returnType === "int" || returnType === "long long") return "0";
  if (returnType === "double") return "0.0";
  if (returnType.startsWith("std::vector")) return "{}";
  if (returnType === "std::string") return "std::string{}";
  return "{}";
};

/** `two_sum` → `twoSum`; already-camelCase names pass through. */
export function toLeetCodeMethodName(snakeOrPyName) {
  const raw = String(snakeOrPyName || "").trim();
  if (!raw) return "";
  if (!raw.includes("_")) return raw;
  const parts = raw.split("_").filter(Boolean);
  if (!parts.length) return "";
  return (
    parts[0].toLowerCase() +
    parts
      .slice(1)
      .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1).toLowerCase() : ""))
      .join("")
  );
}

/** Mirrors backend runner extras for `class Solution` method lookup. */
const EXTRA_SOLUTION_METHOD_ALIASES = {
  merge_intervals: ["merge", "mergeIntervals"],
};

/**
 * Human-readable contract for the coding runner (must stay aligned with backend executeCode.py logic).
 * @returns {{ kind: "design", designClassName: string } | { kind: "function", defLine: string, solutionMethodCandidates: string[] } | { kind: "none" }}
 */
export function getCodingRunnerContractHints(functionSignature) {
  const sig = String(functionSignature || "").trim();
  const design = parseDesignClassNameFromSignature(sig);
  if (design) {
    return { kind: "design", designClassName: design };
  }
  const parsed = parseFlexibleInterviewSignature(sig);
  if (!parsed.name) {
    return { kind: "none" };
  }
  const params = parsed.params.join(", ");
  const defLine = `def ${parsed.name}(${params}):`;
  const candidates = new Set([parsed.name, toLeetCodeMethodName(parsed.name)]);
  const extras = EXTRA_SOLUTION_METHOD_ALIASES[parsed.name];
  if (Array.isArray(extras)) {
    for (const x of extras) {
      if (x) candidates.add(x);
    }
  }
  return {
    kind: "function",
    defLine,
    solutionMethodCandidates: [...candidates],
  };
}

/** LeetCode-style `vector<int>&` parameters inside `class Solution`. */
const paramDeclForClassMethod = (cppType, name) => {
  if (cppType.startsWith("std::vector") || cppType === "std::string") {
    return `${cppType}& ${name}`;
  }
  return `${cppType} ${name}`;
};

/**
 * @param {string} functionSignature Python `def foo(...):` line
 * @param {unknown} sampleInput first visible testcase input
 * @param {unknown} sampleExpected first visible testcase expectedOutput
 */
/** Generic LeetCode-shaped fallback when question signature is not available yet. */
const cppInterviewFallbackSnippet = () =>
  [
    "#include <vector>",
    "",
    "// Don't alter the existing boilerplate.",
    "// Write your code below this line.",
    "",
    "class Solution {",
    "public:",
    "    // Your implementation goes here (LeetCode-style).",
    "};",
    "",
  ].join("\n");

/**
 * Shared C++ type / decl inference for stub generator and grader-contract UI (must match backend harness).
 * @returns {null | { parsed: { name: string, params: string[] }, returnType: string, method: string, paramDecls: string, classParamDecls: string, includes: string, preludeLines: string[], callArgs: string[] }}
 */
function computeCppInterviewContract(functionSignature, sampleInput, sampleExpected) {
  const parsed = parseFlexibleInterviewSignature(String(functionSignature || "").trim());
  if (!parsed.name) return null;

  const params = parsed.params;
  /** @type {Record<string, string>} */
  const paramTypes = {};
  if (sampleInput != null && typeof sampleInput === "object" && !Array.isArray(sampleInput)) {
    for (const name of params) {
      if (!Object.prototype.hasOwnProperty.call(sampleInput, name)) {
        for (const p of params) {
          paramTypes[p] = inferCppTypeFromParamName(p);
        }
        break;
      }
      paramTypes[name] = inferCppTypeFromJson(sampleInput[name]);
    }
  } else if (Array.isArray(sampleInput)) {
    if (params.length !== 1) {
      for (const p of params) {
        paramTypes[p] = inferCppTypeFromParamName(p);
      }
    } else {
      paramTypes[params[0]] = inferCppTypeFromJson(sampleInput);
    }
  } else if (
    (sampleInput === undefined || sampleInput === null) &&
    params.length > 0 &&
    params.every((p) => /^[A-Za-z_]\w*$/.test(p))
  ) {
    for (const name of params) {
      paramTypes[name] = inferCppTypeFromParamName(name);
    }
  } else {
    if (params.length !== 1) {
      for (const p of params) {
        paramTypes[p] = inferCppTypeFromParamName(p);
      }
    } else {
      paramTypes[params[0]] =
        sampleInput === undefined || sampleInput === null
          ? inferCppTypeFromParamName(params[0])
          : inferCppTypeFromJson(sampleInput);
    }
  }

  const returnType =
    sampleExpected === undefined || sampleExpected === null
      ? inferReturnHeuristic(parsed.name, paramTypes)
      : inferCppTypeFromJson(sampleExpected);
  const paramDeclForStub = (cppType, name) => {
    if (cppType === "std::string" || cppType.startsWith("std::vector") || cppType === "nlohmann::json") {
      return `const ${cppType}& ${name}`;
    }
    return `${cppType} ${name}`;
  };
  const paramDecls = params.map((p) => paramDeclForStub(paramTypes[p], p)).join(", ");
  const classParamDecls = params.map((p) => paramDeclForClassMethod(paramTypes[p], p)).join(", ");
  const includes = includesForTypes(
    `${returnType} ${params.map((p) => paramTypes[p]).join(" ")}`
  );

  const method = toLeetCodeMethodName(parsed.name);
  const preludeLines = [];
  const callArgs = [];
  for (const p of params) {
    const t = paramTypes[p];
    if (t.startsWith("std::vector") || t === "std::string") {
      preludeLines.push(`${t} ${p}_rv = ${p};`);
      callArgs.push(`${p}_rv`);
    } else {
      callArgs.push(p);
    }
  }

  return {
    parsed,
    returnType,
    method,
    paramDecls,
    classParamDecls,
    includes,
    preludeLines,
    callArgs,
  };
}

/**
 * C++ runner contract for UI (aligned with `buildCppStubFromInterviewDraft` / backend).
 * @returns {{ kind: "design", designClassName: string } | { kind: "function", freeFunctionDecl: string, classMethodDecl: string, solutionMethodName: string } | { kind: "none" }}
 */
export function getCppGraderContractHints(functionSignature, sampleInput, sampleExpected) {
  const sig = String(functionSignature || "").trim();
  const design = parseDesignClassNameFromSignature(sig);
  if (design) {
    return { kind: "design", designClassName: design };
  }
  const c = computeCppInterviewContract(sig, sampleInput, sampleExpected);
  if (!c) return { kind: "none" };
  const { parsed, returnType, method, paramDecls, classParamDecls } = c;
  return {
    kind: "function",
    freeFunctionDecl: `${returnType} ${parsed.name}(${paramDecls})`,
    classMethodDecl: `${returnType} ${method}(${classParamDecls})`,
    solutionMethodName: method,
  };
}

export function buildCppStubFromInterviewDraft(functionSignature, sampleInput, sampleExpected) {
  const c = computeCppInterviewContract(functionSignature, sampleInput, sampleExpected);
  if (!c) {
    return cppInterviewFallbackSnippet();
  }

  const { parsed, returnType, method, paramDecls, classParamDecls, includes, preludeLines, callArgs } = c;
  const preludeBlock = preludeLines.length ? `${preludeLines.map((line) => `  ${line}`).join("\n")}\n` : "";

  return `${includes}

// Don't alter the existing boilerplate.
// Write your code below this line (implement inside class Solution — Solution::${method}).

class Solution {
public:
  ${returnType} ${method}(${classParamDecls}) {
    // TODO: your logic here
    return ${defaultReturnSnippet(returnType)};
  }
};

// Don't alter the existing boilerplate.

${returnType} ${parsed.name}(${paramDecls}) {
  Solution sol;
${preludeBlock}  return sol.${method}(${callArgs.join(", ")});
}
`;
}

export function looksLikePythonInterviewCode(text) {
  return /\bdef\s+\w+\s*\(/.test(String(text || ""));
}

/** Editor buffer looks like C++ (common mismatch when language is still Python). */
export function looksLikeCppInterviewCode(text) {
  const s = String(text || "");
  if (!s.trim()) return false;
  if (/^\s*#\s*include\b/m.test(s)) return true;
  if (/\bstd::/.test(s)) return true;
  if (/\busing\s+namespace\s+std\b/.test(s)) return true;
  if (/\bvector\s*</.test(s)) return true;
  if (/\b(int|void|bool|char|long|unsigned|auto)\s+\w+\s*\([^)]*\)\s*\{/.test(s)) return true;
  return false;
}

/**
 * @param {string} starterCode from question `dsaMetadata.starterCode`
 * @param {string} functionSignature Python `def foo(...):` line
 */
export function resolvePythonInterviewStub(starterCode, functionSignature) {
  const starter = String(starterCode || "").trim();
  if (starter) return starter;
  const sig = String(functionSignature || "").trim();
  const designCls = parseDesignClassNameFromSignature(sig);
  if (designCls) {
    return [
      `class ${designCls}:`,
      `    def __init__(self, capacity: int):`,
      `        pass`,
      ``,
      `    def get(self, key: int) -> int:`,
      `        pass`,
      ``,
      `    def put(self, key: int, value: int) -> None:`,
      `        pass`,
      ``,
    ].join("\n");
  }
  const parsed = parseFlexibleInterviewSignature(sig);
  if (!parsed.name) return "def solve():\n    pass\n";
  const params = parsed.params.join(", ");
  return `def ${parsed.name}(${params}):\n    pass\n`;
}

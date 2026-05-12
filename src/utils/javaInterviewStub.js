/**
 * Java grader-contract hints for mock interview DSA (aligned with backend javaHarnessGenerator.js).
 */

import {
  parseFlexibleInterviewSignature,
  parseDesignClassNameFromSignature,
  toLeetCodeMethodName,
} from "./cppInterviewStub.js";

const inferJavaTypeFromJson = (value, depth = 0) => {
  if (depth > 14) return "com.google.gson.JsonElement";
  if (value === null || value === undefined) return "com.google.gson.JsonElement";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "double";
    if (Number.isInteger(value) && Math.abs(value) <= 2147483647) return "int";
    if (Number.isInteger(value)) return "long";
    return "double";
  }
  if (typeof value === "string") return "String";
  if (Array.isArray(value)) {
    if (value.length === 0) return "int[]";
    const inner = inferJavaTypeFromJson(value[0], depth + 1);
    return `${inner}[]`;
  }
  if (typeof value === "object") return "com.google.gson.JsonElement";
  return "com.google.gson.JsonElement";
};

/** When testcase JSON is not loaded yet, infer common DSA parameter types from identifiers. */
const inferJavaTypeFromParamName = (name) => {
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
  if (vectorish.has(lower)) return "int[]";
  if (
    ["s", "str", "pattern", "text", "word", "t", "haystack", "needle", "jewels", "stones", "s1", "s2"].includes(lower)
  ) {
    return "String";
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

const inferJavaReturnHeuristic = (functionName, paramTypes) => {
  const f = String(functionName || "")
    .trim()
    .toLowerCase();
  if (f.includes("two_sum") || f.includes("three_sum") || f.includes("_indices")) return "int[]";
  if (f.includes("duplicate") || f.startsWith("is_") || f.includes("anagram") || f.includes("palindrome")) {
    return "boolean";
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
  if (vals.some((t) => String(t).includes("[]"))) return "int";
  return "int";
};

function computeJavaInterviewContract(functionSignature, sampleInput, sampleExpected) {
  const parsed = parseFlexibleInterviewSignature(String(functionSignature || "").trim());
  if (!parsed.name) return null;

  const params = parsed.params;
  /** @type {Record<string, string>} */
  const paramTypes = {};
  if (sampleInput != null && typeof sampleInput === "object" && !Array.isArray(sampleInput)) {
    for (const name of params) {
      if (!Object.prototype.hasOwnProperty.call(sampleInput, name)) {
        for (const p of params) {
          paramTypes[p] = inferJavaTypeFromParamName(p);
        }
        break;
      }
      paramTypes[name] = inferJavaTypeFromJson(sampleInput[name]);
    }
  } else if (Array.isArray(sampleInput)) {
    if (params.length !== 1) {
      for (const p of params) {
        paramTypes[p] = inferJavaTypeFromParamName(p);
      }
    } else {
      paramTypes[params[0]] = inferJavaTypeFromJson(sampleInput);
    }
  } else if (
    (sampleInput === undefined || sampleInput === null) &&
    params.length > 0 &&
    params.every((p) => /^[A-Za-z_]\w*$/.test(p))
  ) {
    for (const name of params) {
      paramTypes[name] = inferJavaTypeFromParamName(name);
    }
  } else {
    if (params.length !== 1) {
      for (const p of params) {
        paramTypes[p] = inferJavaTypeFromParamName(p);
      }
    } else {
      paramTypes[params[0]] =
        sampleInput === undefined || sampleInput === null
          ? inferJavaTypeFromParamName(params[0])
          : inferJavaTypeFromJson(sampleInput);
    }
  }

  const returnType =
    sampleExpected === undefined || sampleExpected === null
      ? inferJavaReturnHeuristic(parsed.name, paramTypes)
      : inferJavaTypeFromJson(sampleExpected);
  const method = toLeetCodeMethodName(parsed.name);
  const paramDecls = params.map((p) => `${paramTypes[p]} ${p}`).join(", ");

  return { parsed, returnType, method, paramDecls };
}

/**
 * @returns {{ kind: "design", designClassName: string } | { kind: "function", classMethodDecl: string, solutionMethodName: string } | { kind: "none" }}
 */
export function getJavaGraderContractHints(functionSignature, sampleInput, sampleExpected) {
  const sig = String(functionSignature || "").trim();
  const design = parseDesignClassNameFromSignature(sig);
  if (design) {
    return { kind: "design", designClassName: design };
  }
  const c = computeJavaInterviewContract(sig, sampleInput, sampleExpected);
  if (!c) return { kind: "none" };
  const { returnType, method, paramDecls } = c;
  return {
    kind: "function",
    classMethodDecl: `public ${returnType} ${method}(${paramDecls})`,
    solutionMethodName: method,
  };
}

/** Editor buffer looks like Java (mismatch when another language is selected). */
export function looksLikeJavaInterviewCode(text) {
  const s = String(text || "");
  if (!s.trim()) return false;
  if (/\bpublic\s+class\s+Solution\b/.test(s)) return true;
  if (/\bimport\s+java\./.test(s)) return true;
  if (/\bpublic\s+static\s+void\s+main\s*\(/.test(s)) return true;
  return false;
}

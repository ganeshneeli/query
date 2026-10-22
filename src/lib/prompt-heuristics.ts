import type {
  AnalyzeRequest,
  AnalyzeResponse,
  DetectedIssue,
  OptimizePromptRequest,
  OptimizePromptResponse,
} from "@/lib/api/types";

// Deterministic, rule-based heuristics used by the demo adapter.
// These provide instant, high-precision prompt analysis and optimization.

export const estimateTokens = (text: string) =>
  text.trim() ? Math.ceil(text.trim().length / 4) : 0;

const VAGUE_TERMS = /\b(something|stuff|things|some|etc|good|nice|better|maybe|kind of|sort of|bad)\b/gi;

const FILLER =
  /\b(please|kindly|just|really|very|basically|actually|i was wondering if|could you possibly|i would like you to|can you please|could you)\b/gi;

const FORMAT_KEYWORDS = /\b(json|table|bullet|list|markdown|csv|steps|paragraph|yaml|code block|format|schema|output)\b/i;

const CONSTRAINT_KEYWORDS =
  /\b(must|should|only|no more than|at most|under|limit|avoid|do not|don't|exactly|words|sentences|strictly)\b/i;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// Transformation dictionary for clarifying ambiguous and colloquial phrasing
const VAGUE_TRANSFORMATIONS: [RegExp, string][] = [
  [
    /\bgive\s+(?:some\s+)?feedback\s+on\s+how\s+to\s+make\s+it\s+better\s+and\s+fix\s+any\s+stuff\s+that(?:'s|\s+is)\s+bad\b/gi,
    "perform an in-depth code review, optimize architecture and maintainability, and identify and remediate syntax errors, code smells, and security vulnerabilities",
  ],
  [
    /\bgive\s+(?:some\s+)?feedback\s+on\s+how\s+to\s+make\s+it\s+better\b/gi,
    "provide prioritized, actionable feedback covering architecture, performance, and maintainability",
  ],
  [
    /\bfix\s+any\s+stuff\s+that(?:'s|\s+is)\s+bad\b/gi,
    "identify and rectify logic defects, code smells, and anti-patterns with clean refactoring",
  ],
  [
    /\bmake\s+it\s+better\b/gi,
    "optimize for performance, readability, and production-grade reliability",
  ],
  [
    /\bfix\s+(?:any\s+)?(?:stuff|things|bugs)\b/gi,
    "rectify syntax errors, logic flaws, and edge cases",
  ],
  [/\b(?:some\s+)?stuff\b/gi, "logic components and edge cases"],
  [/\b(?:some\s+)?things\b/gi, "specifications and parameters"],
  [/\bsome\s+feedback\b/gi, "comprehensive, structured feedback"],
  [/\bsomething\b/gi, "a concrete solution"],
  [/\bkind\s+of\b|\bsort\s+of\b|\bmaybe\b/gi, ""],
  [/\bpretty\s+good\b|\bgood\b/gi, "production-grade"],
  [/\bnice\b/gi, "clean and well-structured"],
  [/\bbetter\b/gi, "optimized and robust"],
  [/\betc(?:\.|\b)/gi, "and related edge cases"],
  [/\bbad\b/gi, "sub-optimal or defective"],
];

const ROLE: Record<string, string> = {
  General: "a knowledgeable, precise technical assistant",
  Coding: "a senior software engineer and architect",
  Research: "a rigorous research analyst and domain specialist",
  Summarization: "an expert technical editor and content synthesizer",
  Education: "an expert instructor focusing on clarity and foundational principles",
  "Data Analysis": "a principal data scientist and quantitative analyst",
  Writing: "an expert technical writer and communications specialist",
};

/**
 * Analyzes a prompt and computes multi-dimensional quality indicators.
 */
export function analyzePrompt(req: AnalyzeRequest): AnalyzeResponse {
  const p = req.prompt.trim();
  const words = p.split(/\s+/).filter(Boolean);
  const vagueMatches = p.match(VAGUE_TERMS);
  const vague = vagueMatches?.length ?? 0;
  const fillerMatches = p.match(FILLER);
  const filler = fillerMatches?.length ?? 0;
  const hasFormat = FORMAT_KEYWORDS.test(p) || (!!req.outputFormat && req.outputFormat !== "none");
  const hasConstraints = CONSTRAINT_KEYWORDS.test(p) || !!req.constraints?.trim();
  const hasContext = (req.context?.trim().length ?? 0) > 20 || words.length > 35;
  const isStructured = /\b(Task|Constraints|Output format|Context|Verification):/i.test(p);

  const issues: DetectedIssue[] = [];

  if (vague > 0 || words.length < 8) {
    issues.push({
      kind: "ambiguity",
      label: "Ambiguity",
      severity: vague > 2 ? "high" : vague > 0 ? "medium" : "low",
      detail:
        vague > 0
          ? `${vague} vague or colloquial term(s) detected (${vagueMatches?.slice(0, 3).map((v) => `"${v}"`).join(", ")}).`
          : "The prompt is terse and lacks specific operational directives.",
    });
  }

  if (!hasContext) {
    issues.push({
      kind: "missing_context",
      label: "Missing Context",
      severity: "medium",
      detail: "No target environment, audience, or baseline assumptions specified.",
    });
  }

  if (!hasConstraints) {
    issues.push({
      kind: "missing_constraints",
      label: "Missing Constraints",
      severity: "medium",
      detail: "No boundaries regarding length, scope, exclusions, or error conditions are stated.",
    });
  }

  if (!hasFormat) {
    issues.push({
      kind: "unspecified_format",
      label: "Unspecified Output Format",
      severity: "low",
      detail: "Output structure is open-ended. Adding schema or section markers improves consistency.",
    });
  }

  if (filler > 0) {
    issues.push({
      kind: "unnecessary_wording",
      label: "Unnecessary Wording",
      severity: "low",
      detail: `${filler} filler token(s) detected without semantic value.`,
    });
  }

  // Calculate refined quality indicators based on structural components
  const lengthPenalty = words.length < 15 && !isStructured ? (15 - words.length) * 2.5 : 0;
  const baseClarity = 84 - vague * 14 - filler * 5 - lengthPenalty;
  const clarity = clamp(baseClarity + (isStructured ? 12 : 0));

  const lengthScore = Math.min(words.length / 45, 1) * 35;
  const specificity = clamp(
    38 + lengthScore + (hasConstraints ? 22 : 0) + (isStructured ? 15 : 0) - vague * 9,
  );

  const contextCompleteness = clamp(
    (req.context?.trim().length ?? 0) > 15
      ? 92
      : hasContext
        ? isStructured ? 88 : 78
        : 35 + lengthScore / 2,
  );

  const instructionFollowing = clamp(
    52 +
      (hasFormat ? 22 : 0) +
      (hasConstraints ? 20 : 0) +
      (isStructured ? 12 : 0) -
      vague * 6,
  );

  const constraintCoverage = clamp(
    (req.constraints?.trim().length ?? 0) > 15
      ? 95
      : hasConstraints
        ? isStructured ? 92 : 82
        : 28,
  );

  return {
    issues,
    estimatedTokens: estimateTokens(p + (req.context ?? "") + (req.constraints ?? "")),
    source: "heuristic",
    indicators: {
      clarity,
      specificity,
      contextCompleteness,
      instructionFollowing,
      constraintCoverage,
    },
  };
}

/**
 * Intelligent prompt parser that deconstructs an existing prompt into its constituent parts
 * to prevent recursive prefix duplication (e.g. "Task: You are a senior software engineer...").
 */
function parsePromptSections(rawPrompt: string) {
  const lines = rawPrompt.split("\n");
  let task = "";
  let extractedContext = "";
  const extractedConstraints: string[] = [];
  let extractedFormat = "";

  let currentSection: "unknown" | "role" | "task" | "context" | "constraints" | "format" | "other" = "unknown";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^You are\b/i.test(trimmed) || /^Role:/i.test(trimmed)) {
      currentSection = "role";
      continue;
    } else if (/^Task:/i.test(trimmed)) {
      currentSection = "task";
      task += (task ? " " : "") + trimmed.replace(/^Task:\s*/i, "");
    } else if (/^Context:/i.test(trimmed)) {
      currentSection = "context";
      extractedContext += (extractedContext ? " " : "") + trimmed.replace(/^Context:\s*/i, "");
    } else if (/^Constraints?:/i.test(trimmed)) {
      currentSection = "constraints";
    } else if (/^Output format:/i.test(trimmed) || /^Format:/i.test(trimmed)) {
      currentSection = "format";
      extractedFormat = trimmed.replace(/^(?:Output format|Format):\s*/i, "");
    } else if (/^(?:Verification|Before answering):/i.test(trimmed)) {
      currentSection = "other";
    } else {
      if (currentSection === "task" || currentSection === "unknown") {
        task += (task ? " " : "") + trimmed;
      } else if (currentSection === "context") {
        extractedContext += (extractedContext ? " " : "") + trimmed;
      } else if (currentSection === "constraints") {
        extractedConstraints.push(trimmed.replace(/^[-*•]\s*/, ""));
      } else if (currentSection === "format") {
        extractedFormat += " " + trimmed;
      }
    }
  }

  return {
    task: task || rawPrompt.trim(),
    context: extractedContext.trim(),
    constraints: extractedConstraints,
    outputFormat: extractedFormat.trim(),
  };
}

/**
 * Transforms vague words into sharp, unambiguous domain directives.
 */
function clarifyText(input: string): string {
  let cleaned = input.replace(FILLER, " ").replace(/\s{2,}/g, " ").trim();

  for (const [pattern, replacement] of VAGUE_TRANSFORMATIONS) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  return cleaned.replace(/\s{2,}/g, " ").trim();
}

/**
 * Optimizes any user prompt by eliminating vagueness, injecting structural sections,
 * setting strict constraints, and ensuring high-quality measurable outcomes.
 */
export function optimizePromptHeuristic(req: OptimizePromptRequest): OptimizePromptResponse {
  const original = analyzePrompt(req);
  const parsed = parsePromptSections(req.prompt);

  // Clean the core task of all filler words and vague expressions
  const clarifiedTask = clarifyText(parsed.task);

  // Length constraints based on configuration
  const lengthConstraint = {
    short: "Keep the response strictly concise and under 120 words.",
    medium: "Keep the response comprehensive yet focused between 150 and 300 words.",
    long: "Provide an in-depth, thorough analysis of up to 800 words.",
  }[req.outputLength];

  // Assemble system persona
  const assignedRole = ROLE[req.taskType] ?? ROLE["General"];

  const parts: string[] = [`You are ${assignedRole}.`, "", `Task:\n${clarifiedTask}`];

  // Context specification
  const mergedContext = [
    req.context?.trim(),
    parsed.context,
    req.taskType === "Coding"
      ? "Evaluate against production engineering standards, checking for algorithmic complexity, modularity, type safety, and edge-case coverage."
      : req.taskType === "Research"
        ? "Evaluate against verified empirical evidence, citing methodology and acknowledging confidence levels."
        : req.taskType === "Data Analysis"
          ? "Ensure statistical validity, noting distribution shapes, outliers, and variance."
          : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (mergedContext.trim()) {
    parts.push("", `Context:\n${mergedContext.trim()}`);
  }

  // Constraints specification
  const allConstraints = [
    lengthConstraint,
    ...parsed.constraints,
    ...(req.constraints?.trim() ? [req.constraints.trim()] : []),
    "If information is missing, ambiguous, or uncertain, state the gap explicitly instead of making unverified assumptions.",
  ];

  if (req.strategy === "Quality First") {
    allConstraints.push("Ensure every assertion is accompanied by rationale or concrete examples.");
  } else if (req.strategy === "Low Cost" || req.strategy === "Low Latency") {
    allConstraints.push("Eliminate introductory conversational pleasantries and proceed directly to actionable solutions.");
  }

  // Deduplicate and filter constraints
  const uniqueConstraints = Array.from(new Set(allConstraints.map((c) => c.replace(/^[-*•]\s*/, "").trim()))).filter(
    Boolean,
  );

  parts.push("", "Constraints:", ...uniqueConstraints.map((c) => `- ${c}`));

  // Output format specification
  const finalFormat =
    req.outputFormat && req.outputFormat !== "none"
      ? req.outputFormat
      : parsed.outputFormat
        ? parsed.outputFormat
        : req.taskType === "Coding"
          ? "Issues Found (bullet points), Suggested Refactor (language-tagged code block), Key Improvements & Time Complexity Analysis"
          : "Structured Markdown with clear section headings followed by concise, bulleted explanations.";

  parts.push("", `Output Format:\n${finalFormat}`);

  // Self-verification & CoT directive based on strategy
  if (req.strategy === "Quality First") {
    parts.push(
      "",
      "Verification:\nBefore finalizing the response, systematically verify compliance against each constraint stated above.",
    );
  } else if (req.strategy === "Balanced") {
    parts.push(
      "",
      "Verification:\nEnsure all key points directly address the primary task without redundant filler.",
    );
  }

  const optimizedPrompt = parts.join("\n");

  // Re-analyze optimized prompt to compute actual improved indicators
  const optimized = analyzePrompt({
    ...req,
    prompt: optimizedPrompt,
    context: mergedContext,
    constraints: uniqueConstraints.join(" "),
    outputFormat: finalFormat,
  });

  // Calculate changes and benefits for the explanation panel
  const whatChanged: string[] = [
    `Assigned authoritative persona: "${assignedRole}"`,
    "Restructured prompt into explicit sections: Task, Context, Constraints, and Output Format",
  ];

  if (original.issues.some((i) => i.kind === "ambiguity")) {
    whatChanged.push("Replaced vague, colloquial phrasing with precise operational directives");
  }

  if (original.issues.some((i) => i.kind === "unnecessary_wording")) {
    whatChanged.push("Removed filler phrases to maximize signal-to-noise ratio");
  }

  if (!parsed.constraints.length) {
    whatChanged.push(`Injected ${uniqueConstraints.length} structural constraints including length limits and hallucination guards`);
  }

  const benefits: string[] = [
    "Eliminates output hallucination by requiring explicit disclosure of uncertainty",
    "Provides predictable, schema-aligned responses ready for downstream integration",
    "Reduces clarification turns and repeated prompting cycles",
    "Enforces strict length boundaries to prevent verbose token waste",
  ];

  const tradeoffs: string[] = [
    `Prompt expanded from ~${original.estimatedTokens} to ~${estimateTokens(optimizedPrompt)} tokens to guarantee structural adherence`,
    "Strict output schema reduces open-ended creative variance",
  ];

  return {
    optimizedPrompt,
    original,
    optimized,
    iterations: Math.min(req.maxIterations, 1),
    source: "heuristic",
    explanation: {
      whatChanged,
      why: original.issues.length
        ? original.issues.map((i) => `${i.label}: ${i.detail}`)
        : ["Baseline prompt lacked explicit negative constraints and verification rules."],
      benefit: benefits,
      tradeoffs: tradeoffs,
    },
  };
}

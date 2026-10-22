import type {
  AnalyzeRequest,
  AnalyzeResponse,
  DetectedIssue,
  OptimizePromptRequest,
  OptimizePromptResponse,
} from "@/lib/api/types";

// Deterministic, rule-based heuristics used by the demo adapter.
// These are NOT LLM measurements; they are labelled "heuristic" everywhere.

export const estimateTokens = (text: string) =>
  text.trim() ? Math.ceil(text.trim().length / 4) : 0;

const VAGUE = /\b(something|stuff|things|some|etc|good|nice|better|maybe|kind of|sort of)\b/gi;
const FILLER =
  /\b(please|kindly|just|really|very|basically|actually|i was wondering if|could you possibly|i would like you to)\b/gi;
const FORMAT = /\b(json|table|bullet|list|markdown|csv|steps|paragraph|yaml|code block|format)\b/i;
const CONSTRAINT =
  /\b(must|should|only|no more than|at most|under|limit|avoid|do not|don't|exactly|words|sentences)\b/i;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function analyzePrompt(req: AnalyzeRequest): AnalyzeResponse {
  const p = req.prompt;
  const words = p.trim().split(/\s+/).filter(Boolean);
  const vague = p.match(VAGUE)?.length ?? 0;
  const filler = p.match(FILLER)?.length ?? 0;
  const hasFormat = FORMAT.test(p) || !!req.outputFormat;
  const hasConstraints = CONSTRAINT.test(p) || !!req.constraints?.trim();
  const hasContext = (req.context?.trim().length ?? 0) > 20 || words.length > 40;

  const issues: DetectedIssue[] = [];
  if (vague > 0 || words.length < 8)
    issues.push({
      kind: "ambiguity",
      label: "Ambiguity",
      severity: vague > 2 ? "high" : "medium",
      detail:
        vague > 0
          ? `${vague} vague term(s) such as "${(p.match(VAGUE) ?? [""])[0]}".`
          : "The request is very short and open to interpretation.",
    });
  if (!hasContext)
    issues.push({
      kind: "missing_context",
      label: "Missing context",
      severity: "medium",
      detail: "No audience, background, or source material is provided.",
    });
  if (!hasConstraints)
    issues.push({
      kind: "missing_constraints",
      label: "Missing constraints",
      severity: "medium",
      detail: "No length, scope, or exclusion rules are stated.",
    });
  if (!hasFormat)
    issues.push({
      kind: "unspecified_format",
      label: "Unspecified output format",
      severity: "low",
      detail: "The expected structure of the answer is not defined.",
    });
  if (filler > 1)
    issues.push({
      kind: "unnecessary_wording",
      label: "Unnecessary wording",
      severity: "low",
      detail: `${filler} filler phrase(s) add tokens without adding meaning.`,
    });

  const lengthScore = Math.min(words.length / 40, 1) * 30;
  return {
    issues,
    estimatedTokens: estimateTokens(p + (req.context ?? "") + (req.constraints ?? "")),
    source: "heuristic",
    indicators: {
      clarity: clamp(85 - vague * 12 - filler * 4 + (words.length > 6 ? 0 : -25)),
      specificity: clamp(35 + lengthScore + (hasConstraints ? 20 : 0) - vague * 8),
      contextCompleteness: clamp(hasContext ? 80 : 35 + lengthScore / 2),
      instructionFollowing: clamp(
        50 + (hasFormat ? 20 : 0) + (hasConstraints ? 20 : 0) - vague * 5,
      ),
      constraintCoverage: clamp(hasConstraints ? 82 : 25),
    },
  };
}

const ROLE: Record<string, string> = {
  General: "a knowledgeable assistant",
  Coding: "a senior software engineer",
  Research: "a careful research analyst",
  Summarization: "an expert editor",
  Education: "a patient instructor",
  "Data Analysis": "an experienced data analyst",
  Writing: "a professional writer",
};

export function optimizePromptHeuristic(req: OptimizePromptRequest): OptimizePromptResponse {
  const original = analyzePrompt(req);
  const cleaned = req.prompt
    .replace(FILLER, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const lengthHint = {
    short: "Keep the answer under 120 words.",
    medium: "Keep the answer between 150 and 300 words.",
    long: "Provide a thorough answer of up to 800 words.",
  }[req.outputLength];
  const parts = [`You are ${ROLE[req.taskType] ?? ROLE["General"]}.`, "", `Task: ${cleaned}`];
  if (req.context?.trim()) parts.push("", `Context: ${req.context.trim()}`);
  const constraints = [
    req.constraints?.trim(),
    lengthHint,
    "If information is missing or uncertain, say so explicitly instead of guessing.",
  ].filter(Boolean);
  parts.push("", "Constraints:", ...constraints.map((c) => `- ${c}`));
  parts.push(
    "",
    `Output format: ${req.outputFormat && req.outputFormat !== "none" ? req.outputFormat : "Clear headings followed by concise bullet points."}`,
  );
  if (req.strategy === "Quality First")
    parts.push("", "Before answering, briefly check your answer against each constraint.");
  const optimizedPrompt = parts.join("\n");
  const optimized = analyzePrompt({
    ...req,
    prompt: optimizedPrompt,
    constraints: constraints.join(" "),
    outputFormat: "structured",
  });

  return {
    optimizedPrompt,
    original,
    optimized,
    iterations: Math.min(req.maxIterations, 1),
    source: "heuristic",
    explanation: {
      whatChanged: [
        "Added an explicit role",
        "Separated task, context, constraints and output format",
        ...(original.issues.some((i) => i.kind === "unnecessary_wording")
          ? ["Removed filler phrases"]
          : []),
      ],
      why: original.issues.map((i) => `${i.label}: ${i.detail}`),
      benefit: [
        "More predictable structure",
        "Fewer clarification turns",
        "Explicit handling of uncertainty",
      ],
      tradeoffs: [
        `Prompt grows from ~${original.estimatedTokens} to ~${estimateTokens(optimizedPrompt)} tokens`,
        "A stricter structure can reduce creative variation",
      ],
    },
  };
}

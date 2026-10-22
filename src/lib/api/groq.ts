// Groq API client for ultra-fast, high-intelligence PromptCowboy-style prompt expansion.
// Groq runs open-source models at 500-800 tokens/sec.

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
export const FAST_GROQ_MODEL = "qwen/qwen3.8-27b";

export const CANDIDATE_GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

const STORAGE_KEY = "promptiq.groq.api_key";

export function getStoredGroqKey(): string {
  if (typeof window !== "undefined") {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage?.trim()) return fromStorage.trim();
  }

  // Vite client-side environment variable (injected from .env)
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      const viteKey = import.meta.env["VITE_GROQ_API_KEY"];
      if (viteKey && typeof viteKey === "string" && viteKey.trim()) return viteKey.trim();
    }
  } catch {
    // ignore
  }

  // Server-side (Node / SSR / Cloudflare / Vercel) environment variables
  try {
    if (typeof process !== "undefined" && process.env) {
      const nodeKey = process.env["GROQ_API_KEY"] || process.env["VITE_GROQ_API_KEY"];
      if (nodeKey && typeof nodeKey === "string" && nodeKey.trim()) return nodeKey.trim();
    }
  } catch {
    // ignore
  }

  return "";
}

export function setStoredGroqKey(key: string): void {
  if (typeof window === "undefined") return;
  if (!key.trim()) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }
}

export interface GroqOptimizationOptions {
  taskType?: string;
  strategy?: string;
  outputLength?: "short" | "medium" | "long" | string;
  targetModel?: string;
  context?: string;
  constraints?: string;
  outputFormat?: string;
  temperature?: number;
}

export function buildGroqPromptSystemPrompt(options?: GroqOptimizationOptions): string {
  const taskType = options?.taskType || "General";
  const strategy = options?.strategy || "Balanced";
  const lengthDesc =
    options?.outputLength === "short"
      ? "Short (<120 words)"
      : options?.outputLength === "long"
        ? "Long (up to 800 words)"
        : "Medium (150–300 words)";
  const targetModel = options?.targetModel || "gpt-4o-mini";

  return `You are PromptIQ's Chief AI Prompt Engineer, powered by Groq LPU inference.
Your job is to transform the user's input prompt into the single best, most effective, production-grade prompt for an LLM (such as ${targetModel}).

CORE PRINCIPLES:
1. NEVER REPEAT STATIC TEMPLATES OR CANNED FORMULAS. Do NOT use repetitive boilerplate phrases like "I'm writing a prompt for another AI..." or identical cookie-cutter section lists across different prompts. Every generated prompt must be uniquely crafted, organic, and directly tailored to the specific topic, domain, and task type.
2. DO NOT ANSWER THE PROMPT. You are NOT writing the answer to the prompt yourself. You are writing the OPTIMIZED PROMPT instructions that the user will give to an AI.
3. FIX ALL WEAKNESSES IN THE ORIGINAL PROMPT:
   - Eliminate vague or colloquial wording (e.g. "kind of work better" -> replace with precise technical, mathematical, and architectural criteria).
   - Inject necessary context, domain terminology, and foundational assumptions.
   - Define sharp operational constraints (scope boundaries, exclusions, edge cases, length limits matching "${lengthDesc}").
   - Specify a clean, professional output format.
4. RESPECT THE USER'S CONFIGURATION:
   - Task Type: ${taskType} (infuse appropriate domain depth and evaluation criteria).
   - Strategy: ${strategy} (if Quality First, enforce rigorous validation and depth; if Balanced, keep it sharp, practical, and punchy; if Low Cost/Latency, prioritize concise, high-density instructions).
   - Target Model: ${targetModel}
5. OUTPUT CLEANLINESS:
   - Output ONLY the final optimized prompt text.
   - Do NOT include markdown code fences (\`\`\`), do NOT include meta-chatter ("Here is your prompt:"), do NOT include headers like "**Master Prompt:**" or decorative dividers ("---").
   - The result must be immediately ready to copy, send, or use.`;
}

export const PROMPT_COWBOY_SYSTEM_PROMPT = buildGroqPromptSystemPrompt();

function cleanPromptCowboyOutput(raw: string): string {
  let cleaned = raw.trim();
  // Strip markdown code block wrappers if the model wrapped the entire prompt in ```
  if (cleaned.startsWith("```") && cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
  }
  // Strip header lines like "**Master Prompt...**" or "### Optimized Prompt" or decorative dividers "---"
  cleaned = cleaned
    .replace(
      /^(\*{1,3}|#{1,4})\s*(?:Master|Optimized|Refined|Production-Grade)?\s*Prompt[^:\n]*[:\n]*(\*{1,3})?\s*/i,
      "",
    )
    .replace(/^---\s*\n*/, "")
    .replace(/\n*---\s*$/, "")
    .trim();

  // Strip leading conversational phrases like "Here is your PromptCowboy prompt:" or "Prompt:"
  cleaned = cleaned
    .replace(
      /^(?:Here is (?:your|the) (?:PromptCowboy|master|optimized|production-grade)?\s*prompt:?|Prompt:?)\s*/i,
      "",
    )
    .trim();
  // Strip surrounding quotes if wrapped
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("“") && cleaned.endsWith("”"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

export interface GroqExpansionResponse {
  prompt: string;
  model: string;
}

export async function expandWithGroqDetailed(
  prompt: string,
  apiKey?: string,
  preferredModel = DEFAULT_GROQ_MODEL,
  options?: GroqOptimizationOptions,
): Promise<GroqExpansionResponse> {
  const key = apiKey?.trim() || getStoredGroqKey();
  if (!key) {
    throw new Error(
      "Groq API key required. Please enter your key in the Groq settings modal or set VITE_GROQ_API_KEY in .env.",
    );
  }

  const systemContent = buildGroqPromptSystemPrompt(options);

  const contextSnippet = options?.context?.trim()
    ? `\nBackground Context: ${options.context.trim()}`
    : "";
  const constraintsSnippet = options?.constraints?.trim()
    ? `\nUser Constraints: ${options.constraints.trim()}`
    : "";
  const formatSnippet =
    options?.outputFormat && options.outputFormat !== "none"
      ? `\nDesired Output Format: ${options.outputFormat}`
      : "";

  const userContent = `Original User Prompt:\n"${prompt}"\n\nTask Type: ${options?.taskType || "General"}\nStrategy: ${options?.strategy || "Balanced"}\nOutput Length: ${options?.outputLength || "medium"}${contextSnippet}${constraintsSnippet}${formatSnippet}\n\nProduce the single best optimized prompt for this request.`;

  const modelsToTry = [
    preferredModel,
    ...CANDIDATE_GROQ_MODELS.filter((m) => m !== preferredModel),
  ];
  let lastError = "";

  for (const model of modelsToTry) {
    try {
      const res = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          temperature:
            options?.temperature !== undefined
              ? Math.min(Math.max(options.temperature, 0.2), 0.8)
              : 0.5,
          max_tokens: 1500,
          messages: [
            {
              role: "system",
              content: systemContent,
            },
            {
              role: "user",
              content: userContent,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const expanded = data.choices?.[0]?.message?.content?.trim();
        if (expanded) {
          return {
            prompt: cleanPromptCowboyOutput(expanded),
            model,
          };
        }
      }

      let errorDetail = res.statusText;
      try {
        const errJson = (await res.json()) as { error?: { message?: string; code?: string } };
        if (errJson.error?.message) errorDetail = errJson.error.message;
        if (
          errJson.error?.code === "model_not_found" ||
          errorDetail.includes("does not exist") ||
          errorDetail.includes("access to it")
        ) {
          lastError = errorDetail;
          continue;
        }
      } catch {
        // ignore
      }
      throw new Error(`Groq API error (${res.status}): ${errorDetail}`);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message.includes("model_not_found") ||
          err.message.includes("does not exist") ||
          err.message.includes("access to it"))
      ) {
        lastError = err.message;
        continue;
      }
      throw err;
    }
  }

  throw new Error(`Groq API error: None of the candidate models were available. (${lastError})`);
}

export async function expandWithGroq(
  prompt: string,
  apiKey?: string,
  preferredModel = DEFAULT_GROQ_MODEL,
  options?: GroqOptimizationOptions,
): Promise<string> {
  const res = await expandWithGroqDetailed(prompt, apiKey, preferredModel, options);
  return res.prompt;
}

export async function testGroqConnection(
  apiKey?: string,
): Promise<{ ok: boolean; model: string; message: string }> {
  const key = apiKey?.trim() || getStoredGroqKey();
  if (!key) {
    return { ok: false, model: "", message: "No Groq API key found." };
  }

  for (const model of CANDIDATE_GROQ_MODELS) {
    try {
      const res = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: 5,
          messages: [{ role: "user", content: "hi" }],
        }),
      });

      if (res.ok) {
        return {
          ok: true,
          model,
          message: `Connected successfully using ${model}!`,
        };
      }
    } catch {
      // try next
    }
  }

  return { ok: false, model: "", message: "Failed to connect to Groq with provided key." };
}

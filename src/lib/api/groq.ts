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

  // Vite client-side environment variable
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

export const PROMPT_COWBOY_SYSTEM_PROMPT = `You are the world's foremost AI Prompt Architect, modeled after PromptCowboy (promptcowboy.ai).
Your job is to transform brief, casual, or "lazy prompts" (like "i want build and ecommerce app", "write a snake game in python", "create a marketing plan for my saas") into magnificent, production-grade, comprehensive master prompts for LLMs.

Follow the PromptCowboy blueprint:
1. Expert Persona: Start with an authoritative persona (e.g., "You are a senior full-stack engineer who specializes in production-grade systems...").
2. Core Scope & Objectives: Clearly define the end-to-end deliverables, key workflows, and user journeys.
3. Sensible Architecture Choices: If the user did not specify technologies, state: "I have not yet specified a stack, platform, or feature set, so make sensible, modern choices and state them clearly at the top of your response with rationale."
4. Production-Ready, Not a Sketch: Instruct the model to build a complete, runnable solution with proper file structures, error handling, and realistic mocks instead of vague pseudocode or placeholders.
5. Strict Negative Constraints: Explicitly list what to exclude to avoid scope creep (e.g., "Do not add multi-tenant billing, complex microservices, or unrequested features unless asked.").
6. Security & Engineering Standards: Mandate environment variables for secrets, modular boundaries, type safety, and clean separation of concerns.
7. Clear Deliverables: Instruct the model to provide complete code, a README with installation and start commands, and a list of next steps.

Output ONLY the final, polished master prompt text without conversational filler, explanations, or quotes, so it is ready to copy and run immediately.`;

export async function expandWithGroq(
  prompt: string,
  apiKey?: string,
  preferredModel = DEFAULT_GROQ_MODEL,
): Promise<string> {
  const key = apiKey?.trim() || getStoredGroqKey();
  if (!key) {
    throw new Error(
      "Groq API key required. Please enter your key in the Groq settings modal or set VITE_GROQ_API_KEY in .env.",
    );
  }

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
          temperature: 0.6,
          max_tokens: 1500,
          messages: [
            {
              role: "system",
              content: PROMPT_COWBOY_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: `Transform this lazy prompt into an incredible, detailed PromptCowboy-grade prompt:\n\n"${prompt}"`,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const expanded = data.choices?.[0]?.message?.content?.trim();
        if (expanded) return expanded;
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

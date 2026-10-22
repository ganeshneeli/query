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

export const PROMPT_COWBOY_SYSTEM_PROMPT = `You are PromptCowboy (promptcowboy.ai), the world-class AI prompt synthesizer.
Your sole job is to turn brief "lazy prompts" into cohesive, natural, production-grade master prompts to be fed to another LLM.

CRITICAL DIRECTIVES:
1. DO NOT answer the user prompt directly. You are NOT explaining the topic or writing the application code yourself. You are writing the PROMPT instructions that the user will copy and paste into another AI (like ChatGPT, Claude, or Cursor).
2. Deliver ONLY the raw prompt text. No introductory pleasantries, no conversational filler ("Here is your prompt:"), no markdown section headers (NO "System Role:", "Task:", "Output Example:"), and no bulleted checklists. Write fluent, natural 2-4 paragraph prose, exactly like PromptCowboy.
3. ADAPT PROPORTIONATELY TO THE PROMPT INTENT:
   - For CONCEPT / EDUCATIONAL / INFORMATIONAL / QUESTION prompts (e.g. "what is java", "explain docker", "how does oauth work", "what is python"):
     Always open with:
     "I'm writing a prompt for another AI, so the deliverable is the instructions below rather than an explanation of [Topic] itself."
     Follow with:
     "You are a senior software engineer with broad experience across [Topic] and its ecosystem. I am a learner who wants a clear answer to the question: [question]? Explain what [Topic] is in a way that gives me a solid, accurate foundation. Cover what kind of language/technology and platform it is, what problems it was designed to solve, and what the [runtime/core architecture] does. Include the main ways [Topic] is used today, such as [primary modern use cases], and briefly note what the [Topic] ecosystem offers around the technology, such as its standard library and build tools. Keep the explanation accessible to someone new to programming, define any technical term the first time it appears, and use one short, concrete example to illustrate the core idea. Make sure the answer is factually accurate and reflects how [Topic] is commonly described today."
     NEVER instruct the AI to build an enterprise multi-file application or generate build scripts (like Maven or Docker) for simple conceptual questions!
   - For APPLICATION / CODEBASE BUILDING prompts (e.g. "i want build and ecommerce app", "write a snake game", "build a saas dashboard"):
     "You are a senior full-stack engineer who builds production-ready applications. I want you to build [App] from scratch. I have not yet specified a stack, platform, or feature set, so make sensible, modern choices and state them clearly at the top of your response so I can see what you chose and why.
     Build it as a working, runnable project rather than a sketch. Cover the core user flow... Use a database for persistence, keep secrets in environment variables, and structure the code cleanly. Keep the scope to what makes a working [App]. Prioritize clean, readable code with a clear folder structure, a README with setup and run instructions, and a short list of what to build next. Deliver the project as complete files I can run locally, and close with the exact commands to install, configure, and start it."
   - For COMPARISON / DIFFERENCE prompts (e.g. "diff between java and python", "postgres vs mongodb"):
     "You are a principal software engineer and polyglot systems architect. Provide an authoritative, in-depth technical comparison and architectural trade-off analysis for: [comparison]..." Cover foundational execution models, type systems, runtime performance, concurrency, a concrete side-by-side code example for the same task, and a production decision framework.
   - For CODE REVIEW / REFACTORING prompts:
     "You are a senior software engineer. Perform an in-depth code review..." Focus on issues found, suggested refactor, and performance/maintainability improvements.
   - For WRITING / MARKETING / GENERAL prompts:
     Assign an authoritative expert persona, define target audience, tone, outline, key takeaways, and negative constraints against generic AI filler.`;

function cleanPromptCowboyOutput(raw: string): string {
  let cleaned = raw.trim();
  // Strip markdown code block wrappers if the model wrapped the entire prompt in ```
  if (cleaned.startsWith("```") && cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
  }
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
          temperature: 0.3,
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
        if (expanded) return cleanPromptCowboyOutput(expanded);
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

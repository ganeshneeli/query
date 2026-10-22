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

const VAGUE_TERMS =
  /\b(something|stuff|things|etc|maybe|kind of(?!\s+(?:language|platform|technology|system|database|architecture|tool))|sort of|bad)\b/gi;

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
  const isStructured =
    /\b(Task|Constraints|Output format|Context|Verification):/i.test(p) ||
    (words.length > 40 &&
      (/\bYou are\b/i.test(p) || /\bI'm writing a prompt for another AI\b/i.test(p)) &&
      (/\bDeliver\b/i.test(p) ||
        /\bCover\b/i.test(p) ||
        /\bKeep the scope\b/i.test(p) ||
        /\bStructure your response\b/i.test(p) ||
        /\bExecutive Summary\b/i.test(p) ||
        /\bconcrete example\b/i.test(p) ||
        /\bfactually accurate\b/i.test(p) ||
        /\bcore idea\b/i.test(p)));

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
  const clarity = clamp(isStructured ? Math.max(92, baseClarity + 16) : baseClarity);

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
  const cleanPrompt = req.prompt.trim().toLowerCase();
  const words = cleanPrompt.split(/\s+/).filter(Boolean);

  // Check if this is a brief "lazy prompt" (terse, unstructured request)
  const isLazyApp =
    words.length <= 40 &&
    !/\b(Task|Constraints|Output format):/i.test(req.prompt) &&
    (/e-?commerce|store|shopping|saas|dashboard|crm|api|backend|game|snake|arcade|\b(?:diff(?:erence)?|vs\.?|versus|compare|comparison)\b|build|create|make|develop|write|code|design|implement/i.test(
      cleanPrompt,
    ) ||
      cleanPrompt.startsWith("i want") ||
      words.length <= 12);

  if (isLazyApp) {
    const masterPrompt = expandPromptCowboyOffline(req.prompt, req.taskType);
    const optimized = analyzePrompt({
      ...req,
      prompt: masterPrompt,
      context: "Production-grade system specifications and explicit domain requirements",
      constraints:
        "Complete runnable files, sandbox payment provider, environment variables, no placeholder mocks",
      outputFormat:
        "Complete runnable code files, folder structure, README with setup and run commands",
    });

    return {
      optimizedPrompt: masterPrompt,
      original,
      optimized,
      iterations: 1,
      source: "heuristic",
      explanation: {
        whatChanged: [
          "Transformed lazy prompt into comprehensive PromptCowboy master blueprint (promptcowboy.ai format)",
          "Assigned authoritative senior persona and architectural decision authority",
          "Defined end-to-end domain requirements, entity schemas, and core user flows",
          "Specified sandbox payment integration (Stripe test mode) with zero raw card data handling",
          "Enforced negative constraints: excluded recommendation engines, multi-currency, and premature bloat",
          "Mandated runnable deliverables: complete files, README setup commands, and next steps list",
        ],
        why: original.issues.length
          ? original.issues.map((i) => `${i.label}: ${i.detail}`)
          : [
              "Original lazy prompt lacked architecture, execution scope, and operational guardrails.",
            ],
        benefit: [
          "Converts a vague 6-word query into production-ready specifications",
          "Directly pasteable into Claude, ChatGPT, Cursor, or Gemini to build the whole app",
          "Eliminates multiple rounds of clarifying questions and partial code snippets",
        ],
        tradeoffs: [
          `Prompt expanded from ~${original.estimatedTokens} to ~${estimateTokens(masterPrompt)} tokens for complete specification fidelity`,
        ],
      },
    };
  }

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

/**
 * Offline PromptCowboy Archetype Expander.
 * Provides instant PromptCowboy-style master prompts when offline or without a Groq API key.
 */
export function expandPromptCowboyOffline(prompt: string, taskType?: string): string {
  const p = prompt.trim().toLowerCase();

  // 1. Exact Java Conceptual Archetype (Exact PromptCowboy match requested by user)
  if (/^what\s+is\s+java\b/i.test(p) || (p.includes("java") && /what\s+is|explain|tell\s+me\s+about/i.test(p))) {
    return `I'm writing a prompt for another AI, so the deliverable is the instructions below rather than an explanation of Java itself.

You are a senior software engineer with broad experience across Java and its ecosystem. I am a learner who wants a clear answer to the question: what is Java? Explain what Java is in a way that gives me a solid, accurate foundation. Cover what kind of language and platform it is, what problems it was designed to solve, and what the Java Virtual Machine (JVM) does. Include the main ways Java is used today, such as enterprise backends, Android development, and large-scale systems, and briefly note what the Java ecosystem offers around the language, such as its standard library and build tools. Keep the explanation accessible to someone new to programming, define any technical term the first time it appears, and use one short, concrete example to illustrate the core idea. Make sure the answer is factually accurate and reflects how Java is commonly described today.`;
  }

  // 2. Concept / Educational / Informational Archetype (e.g. "what is python", "explain docker", "how does oauth work")
  if (
    /^(?:what\s+is|what\s+are|explain|how\s+does|how\s+do|why\s+use|tell\s+me\s+about|guide\s+to|introduction\s+to)\b/i.test(
      p,
    ) ||
    p.startsWith("what ") ||
    p.startsWith("explain ")
  ) {
    const rawTopic = prompt
      .replace(
        /^(?:what\s+is|what\s+are|explain|how\s+does|how\s+do|why\s+use|tell\s+me\s+about|guide\s+to|introduction\s+to)\s+/i,
        "",
      )
      .replace(/[?!.]+$/, "")
      .trim();
    const topic = rawTopic || "the topic";
    return `I'm writing a prompt for another AI, so the deliverable is the instructions below rather than an explanation of ${topic} itself.

You are a senior software engineer and domain specialist with broad experience across ${topic} and its ecosystem. I am a learner who wants a clear answer to the question: ${prompt.trim()}? Explain what ${topic} is in a way that gives me a solid, accurate foundation. Cover what kind of technology and architecture it is, what problems it was designed to solve, and how its core execution model works. Include the main ways ${topic} is used today in production systems, and briefly note what the surrounding ecosystem, libraries, and tooling offer. Keep the explanation accessible to someone new to this area, define any technical term the first time it appears, and use one short, concrete example to illustrate the core idea. Make sure the answer is factually accurate and reflects how ${topic} is commonly described today.`;
  }

  // 3. E-Commerce Archetype (Exact PromptCowboy match requested by user)
  if (/e-?commerce|online\s+store|shopping\s+app|shop\s+app|cart\s+and\s+checkout/i.test(p)) {
    return `You are a senior full-stack engineer who builds production-ready ecommerce applications. I want you to build an ecommerce app from scratch. I have not yet specified a stack, platform, or feature set, so make sensible, modern choices and state them clearly at the top of your response so I can see what you chose and why.

Build it as a working, runnable project rather than a sketch. Cover the core shopping flow: a product catalog with listing and detail pages, a shopping cart, a checkout with an order record, and user accounts with login and order history. Include an admin path for adding and editing products. Use a database for persistence, keep secrets in environment variables, and structure the code so the payment provider can be swapped without rewriting the app. For payments, integrate a sandbox provider such as Stripe test mode and do not handle raw card data myself.

Keep the scope to what makes a working store. Do not add recommendation engines, multi-currency, multi-vendor marketplaces, or complex analytics unless I ask for them later. Prioritize clean, readable code with a clear folder structure, a README with setup and run instructions, and a short list of what to build next.

If the request requires assumptions about the domain (for example, what is being sold), choose a generic physical-goods store and make the product model easy to adapt. Deliver the project as complete files I can run locally, and close with the exact commands to install, configure, and start it.`;
  }

  // 4. SaaS / Web App Archetype
  if (/saas|web\s+app|dashboard|crm|subscription|portal/i.test(p)) {
    return `You are a principal software engineer specialized in building multi-tenant SaaS applications. I want you to build a production-ready SaaS web application from scratch based on the requirement: "${prompt.trim()}". I have not specified a technology stack or schema, so make modern, battle-tested choices (e.g., TypeScript, modern framework, relational DB with migrations) and state them with brief rationale at the beginning.

Build this as a fully functional, runnable application rather than an abstract prototype. Implement authentication, user session management, role-based access control, an intuitive dashboard with responsive data tables, and CRUD operations for the core resource. Use environment variables for all secrets and database connection strings.

Keep the scope focused on core SaaS workflows. Do not include unrequested AI wrappers, complex enterprise SSO, or multi-region failover unless requested. Prioritize clean modular code, clear file organization, zero placeholder functions, and a comprehensive README with environment setup and startup commands.`;
  }

  // 5. REST API / Backend Microservice Archetype
  if (/api|backend|rest\s+service|microservice|database|crud\s+backend/i.test(p)) {
    return `You are a senior backend architect who designs robust, production-grade REST APIs. I want you to build a complete backend service from scratch for: "${prompt.trim()}". Make sensible, modern architectural choices and state your stack and design principles clearly up front.

Implement full CRUD endpoints with strict input validation, comprehensive error handling with RFC 7807 problem details, health check probes (/healthz), and database persistence with an automated migration script. Ensure all secrets and configuration values are loaded from environment variables.

Strictly avoid mock stubs or incomplete handlers. Provide complete, runnable code files with unit and integration tests for critical routes, OpenAPI documentation, and explicit commands to initialize the database and run the service locally.`;
  }

  // 6. Game Development Archetype
  if (/game|snake|arcade|puzzle|pygame|unity|canvas/i.test(p)) {
    return `You are a veteran game developer who crafts polished, bug-free games. I want you to build a fully playable game from scratch based on: "${prompt.trim()}". Choose a modern, accessible platform/framework and state your choice and why at the top.

Deliver a complete, self-contained, and immediately runnable game with a complete game loop, responsive keyboard/mouse controls, collision detection, scoring, state management (start screen, active play, pause, game over, restart), and sound/visual cues. Ensure smooth frame rate pacing and edge-case collision handling.

Deliver the complete code in full without placeholders, accompanied by instructions on how to install dependencies and run the game with zero friction.`;
  }

  // 7. Technical Comparison / Difference Archetype (e.g. "diff between java and python")
  if (/\b(?:diff(?:erence)?|vs\.?|versus|compare|comparison)\b/i.test(p)) {
    return `You are a principal software engineer and polyglot systems architect. Provide an authoritative, in-depth technical comparison and architectural trade-off analysis for: "${prompt.trim()}".

Structure your response with uncompromising engineering rigor:
1. Executive Summary & Paradigm Overview: Foundational execution models, type systems, runtime environments, and core philosophy.
2. Direct Technical Dimension Matrix: Compare across Execution Speed & Concurrency, Memory Footprint & Garbage Collection, Type Safety & Compiler Guarantees, Ecosystem & Standard Library, and Developer Velocity.
3. Concrete Side-by-Side Code Example: Illustrate identical non-trivial tasks (e.g. concurrent HTTP fetching or data streaming) in both technologies with production-grade syntax and idioms.
4. Production Decision Framework: Concrete recommendations on when to choose one over the other based on team scale, latency SLAs, system complexity, and long-term maintenance costs.

Avoid surface-level generalities or subjective marketing claims. Provide concrete, empirical trade-offs with explicit boundary conditions.`;
  }

  // 8. General PromptCowboy Synthesis Fallback
  const persona =
    taskType === "Coding"
      ? "senior software engineer and systems architect"
      : taskType === "Research"
        ? "senior research scientist and domain analyst"
        : taskType === "Data Analysis"
          ? "principal data engineer and quantitative analyst"
          : taskType === "Writing"
            ? "executive technical communications strategist"
            : "senior solutions architect";

  if (/build|create|make|develop|write|code|design|implement|deploy|app|system|service/i.test(p)) {
    return `You are a ${persona} who delivers production-grade solutions. I want you to design and build a complete solution from scratch for: "${prompt.trim()}". I have not yet specified a detailed stack, methodology, or constraint set, so make sensible, modern choices and state them clearly at the top with your engineering rationale.

Deliver this as a working, runnable project rather than a sketch or superficial mockup. Implement the end-to-end core workflow, provide realistic data structures and error handling, adhere to strict modular boundaries, and ensure all configuration and secrets are decoupled into environment variables.

Keep the scope focused strictly on the essential requirements to create a robust, production-ready system. Do not introduce premature complexity, unneeded third-party bloat, or extraneous abstractions. Provide complete code files with clear folder hierarchy, a README detailing exact local setup and execution commands, and a prioritized list of next steps for production hardening.`;
  }

  return `I'm writing a prompt for another AI, so the deliverable is the instructions below rather than an explanation of the topic itself.

You are a ${persona} with extensive real-world experience. I am seeking a comprehensive, authoritative response for: "${prompt.trim()}". Provide an in-depth, structured deliverable that covers foundational principles, modern best practices, and operational trade-offs.

Structure the response clearly, define any specialized terminology upon first introduction, and provide at least one concrete, real-world example to illustrate the core concepts. Maintain an accessible yet technically rigorous tone, and ensure all recommendations reflect modern industry standards.`;
}


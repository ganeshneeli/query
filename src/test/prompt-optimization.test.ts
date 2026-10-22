import { describe, it, expect } from "vitest";
import { analyzePrompt, optimizePromptHeuristic } from "@/lib/prompt-heuristics";

describe("Prompt Optimization Engine", () => {
  it("resolves vague terms and produces measurable quality indicator improvements", () => {
    const raw = `You are a senior software engineer.

Task: Look at this code and give some feedback on how to make it better and fix any stuff that's bad.

Constraints:
- Keep the answer between 150 and 300 words.
- If information is missing or uncertain, say so explicitly instead of guessing.

Output format: Issues Found (bullet points), Suggested Refactor (Python block), Key Improvements

Before answering, briefly check your answer against each constraint.`;

    const res = optimizePromptHeuristic({
      prompt: raw,
      taskType: "Coding",
      model: "gpt-4o-mini",
      strategy: "Quality First",
      maxIterations: 4,
      outputLength: "long",
      temperature: 0.7,
    });

    // 1. Should not duplicate "Task: You are a senior software engineer. Task: ..."
    expect(res.optimizedPrompt).not.toContain("Task:\nYou are a senior software engineer");
    expect(res.optimizedPrompt).not.toContain("Task: Task:");

    // 2. Should resolve vague words ("some feedback", "make it better", "stuff that's bad")
    expect(res.optimizedPrompt).not.toContain("stuff that's bad");
    expect(res.optimizedPrompt).not.toContain("make it better");

    // 3. Optimized quality indicators must strictly improve over original
    expect(res.optimized.indicators.clarity).toBeGreaterThan(res.original.indicators.clarity);
    expect(res.optimized.indicators.specificity).toBeGreaterThanOrEqual(res.original.indicators.specificity);
    expect(res.optimized.indicators.instructionFollowing).toBeGreaterThanOrEqual(res.original.indicators.instructionFollowing);
    expect(res.optimized.indicators.constraintCoverage).toBeGreaterThanOrEqual(res.original.indicators.constraintCoverage);

    // 4. Optimized clarity should be high
    expect(res.optimized.indicators.clarity).toBeGreaterThanOrEqual(85);
  });

  it("handles short unstructured prompts effectively", () => {
    const raw = "write a function to parse json in python";
    const res = optimizePromptHeuristic({
      prompt: raw,
      taskType: "Coding",
      model: "gpt-4o-mini",
      strategy: "Balanced",
      maxIterations: 2,
      outputLength: "medium",
      temperature: 0.7,
    });

    expect(res.original.indicators.clarity).toBeLessThan(70);
    expect(res.optimized.indicators.clarity).toBeGreaterThan(85);
    expect(res.optimized.indicators.specificity).toBeGreaterThan(res.original.indicators.specificity);
    expect(res.optimized.indicators.constraintCoverage).toBeGreaterThan(res.original.indicators.constraintCoverage);
  });

  it("expands lazy prompts like 'i want build and ecommerce app' into PromptCowboy master prompts", () => {
    const raw = "i want build and ecommerce app";
    const res = optimizePromptHeuristic({
      prompt: raw,
      taskType: "Coding",
      model: "claude-3.5-sonnet",
      strategy: "Balanced",
      maxIterations: 3,
      outputLength: "medium",
      temperature: 0.7,
    });

    // Should generate the exact PromptCowboy master prompt
    expect(res.optimizedPrompt).toContain("You are a senior full-stack engineer who builds production-ready ecommerce applications");
    expect(res.optimizedPrompt).toContain("Cover the core shopping flow: a product catalog with listing and detail pages, a shopping cart, a checkout with an order record");
    expect(res.optimizedPrompt).toContain("Stripe test mode");
    expect(res.optimizedPrompt).toContain("Do not add recommendation engines, multi-currency, multi-vendor marketplaces");

    // Indicators should jump dramatically
    expect(res.optimized.indicators.clarity).toBeGreaterThanOrEqual(90);
    expect(res.optimized.indicators.specificity).toBeGreaterThanOrEqual(90);
    expect(res.optimized.indicators.constraintCoverage).toBeGreaterThanOrEqual(90);
  });

  it("optimizes comparison prompts like 'diff between java and python' into architectural comparison blueprints", () => {
    const raw = "diff between java and python";
    const res = optimizePromptHeuristic({
      prompt: raw,
      taskType: "Coding",
      model: "claude-3.5-sonnet",
      strategy: "Balanced",
      maxIterations: 2,
      outputLength: "medium",
      temperature: 0.7,
    });

    expect(res.optimizedPrompt).toContain("polyglot systems architect");
    expect(res.optimizedPrompt).toContain("Direct Technical Dimension Matrix");
    expect(res.optimizedPrompt).toContain("Execution Speed & Concurrency");
    expect(res.optimizedPrompt).toContain("Side-by-Side Code Example");
    expect(res.optimized.indicators.clarity).toBeGreaterThanOrEqual(90);
  });

  it("optimizes conceptual learning prompts like 'what is java' into PromptCowboy educational master prompts", () => {
    const raw = "what is java";
    const res = optimizePromptHeuristic({
      prompt: raw,
      taskType: "Coding",
      model: "claude-3.5-sonnet",
      strategy: "Balanced",
      maxIterations: 2,
      outputLength: "medium",
      temperature: 0.7,
    });

    expect(res.optimizedPrompt).toContain(
      "I'm writing a prompt for another AI, so the deliverable is the instructions below rather than an explanation of Java itself.",
    );
    expect(res.optimizedPrompt).toContain(
      "You are a senior software engineer with broad experience across Java and its ecosystem.",
    );
    expect(res.optimizedPrompt).toContain("Java Virtual Machine (JVM)");
    expect(res.optimizedPrompt).toContain("define any technical term the first time it appears");
    expect(res.optimizedPrompt).toContain("use one short, concrete example to illustrate the core idea");
    expect(res.optimized.indicators.clarity).toBeGreaterThanOrEqual(90);
  });
});


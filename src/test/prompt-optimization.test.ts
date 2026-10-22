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
});

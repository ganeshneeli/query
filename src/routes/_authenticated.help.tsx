import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileCode,
  FileText,
  Gauge,
  HelpCircle,
  Key,
  Layers,
  Lightbulb,
  Play,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { openCommandMenu } from "@/components/layout/command-menu";
import { PageHeader } from "@/components/shared/page-header";
import { copyText } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({
    meta: [
      { title: "Documentation & API Reference — PromptIQ" },
      {
        name: "description",
        content:
          "Guides, architecture deep-dives, metric explanations, and FastAPI reference for PromptIQ.",
      },
      { property: "og:title", content: "Documentation & API Reference — PromptIQ" },
      {
        property: "og:description",
        content:
          "Guides, architecture deep-dives, metric explanations, and FastAPI reference for PromptIQ.",
      },
    ],
  }),
  component: HelpPage,
});

export function HelpPage() {
  const [activeTab, setActiveTab] = useState("start");

  const copyCode = (code: string, label: string) => {
    copyText(code);
    toast.success(`Copied ${label} snippet`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentation & Knowledge Base"
        description="Comprehensive guides, algorithmic deep-dives, evaluation rubrics, and FastAPI integration specifications."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openCommandMenu}>
              <Search className="mr-1.5 h-3.5 w-3.5" />
              Command Menu <kbd className="ml-1.5 rounded border bg-muted px-1 text-[10px]">⌘K</kbd>
            </Button>
            <Button size="sm" asChild>
              <Link to="/prompt-lab">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Launch Prompt Lab
              </Link>
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 max-w-4xl">
          <TabsTrigger value="start">Getting Started</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Engine</TabsTrigger>
          <TabsTrigger value="queries">Query Engine</TabsTrigger>
          <TabsTrigger value="metrics">Metrics & Rubrics</TabsTrigger>
          <TabsTrigger value="api">FastAPI Spec</TabsTrigger>
          <TabsTrigger value="faq">FAQ & Support</TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 1: GETTING STARTED                                          */}
        {/* ============================================================== */}
        <TabsContent value="start" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5 shadow-none space-y-3 border-primary/20">
              <div className="rounded-full bg-primary/10 text-primary p-2 w-fit">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base">1. Optimize Prompts</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Paste instructions into Prompt Lab. PromptIQ identifies ambiguous wording,
                injects constraints, and compresses tokens without losing intent.
              </p>
              <Button variant="outline" size="sm" asChild className="w-full text-xs">
                <Link to="/prompt-lab">Open Prompt Lab →</Link>
              </Button>
            </Card>

            <Card className="p-5 shadow-none space-y-3">
              <div className="rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 p-2 w-fit">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base">2. Optimize Queries</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Transform lexical search queries, tune RAG vector Top-K thresholds, and
                generate SQL covering index recommendations safely.
              </p>
              <Button variant="outline" size="sm" asChild className="w-full text-xs">
                <Link to="/query-lab">Open Query Lab →</Link>
              </Button>
            </Card>

            <Card className="p-5 shadow-none space-y-3">
              <div className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2 w-fit">
                <Gauge className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base">3. Benchmark & Evaluate</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Run side-by-side evaluations across 7 quality dimensions: relevance, groundedness,
                correctness, instruction following, and latency.
              </p>
              <Button variant="outline" size="sm" asChild className="w-full text-xs">
                <Link to="/evaluation">Open Studio →</Link>
              </Button>
            </Card>

            <Card className="p-5 shadow-none space-y-3 border-indigo-500/20">
              <div className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 p-2 w-fit">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base">4. Feedback Refinement</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Close the loop with qualitative ratings and targeted directives. Iteratively refine
                prompts and queries until strict benchmarks are satisfied.
              </p>
              <Button variant="outline" size="sm" asChild className="w-full text-xs">
                <Link to="/prompt-lab">Refine Prompts →</Link>
              </Button>
            </Card>
          </div>

          {/* Project Framework & Objectives Overview */}
          <Card className="p-6 shadow-none space-y-4 border-primary/20 bg-primary/5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <div>
                <h3 className="text-base font-semibold">Innovation & Novelty</h3>
                <p className="text-xs text-muted-foreground">
                  An integrated AI-driven framework combining prompt optimization, query reformulation, response evaluation, and feedback-based refinement in a single workflow.
                </p>
              </div>
              <Badge className="bg-primary text-primary-foreground text-xs">Capstone Specification</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-xs">
              <div className="space-y-1.5 rounded-lg border bg-background p-3.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Core Project Objectives:
                </span>
                <ol className="list-decimal pl-4 space-y-1 text-muted-foreground leading-relaxed">
                  <li><strong>Automatically optimize user prompts and queries</strong> before execution.</li>
                  <li><strong>Improve LLM response relevance, accuracy, and consistency</strong> across tasks.</li>
                  <li><strong>Reduce unnecessary token usage and response latency</strong> for sustainable compute.</li>
                  <li><strong>Measure improvement using quality and performance metrics</strong> in a unified dashboard.</li>
                </ol>
              </div>

              <div className="space-y-1.5 rounded-lg border bg-background p-3.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  Expected Outcomes:
                </span>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground leading-relaxed">
                  <li><strong>Improved response quality and retrieval relevance</strong> via automated restructuring.</li>
                  <li><strong>Reduced token usage and latency</strong> through pre-flight filler removal and indexing.</li>
                  <li><strong>Consistent LLM outputs</strong> enforced through explicit schema constraints.</li>
                  <li><strong>Measurable performance improvement</strong> over baseline prompts and queries.</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-none space-y-4">
            <h3 className="text-base font-semibold">PromptIQ Architectural Framework</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
              PromptIQ sits between user interfaces and Large Language Models as an intelligent
              compiler layer. It deconstructs raw prompts into structural AST representations,
              evaluates them against heuristic flaw taxonomies, and generates model-tailored
              instruction sets that maximize response quality while minimizing cost and latency.
            </p>

            <div className="grid gap-3 sm:grid-cols-4 pt-2 text-xs">
              <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
                <span className="font-semibold text-foreground">Parser & Profiler</span>
                <p className="text-muted-foreground text-[11px]">
                  Extracts tokens, entities, constraints, and intent classification.
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
                <span className="font-semibold text-foreground">Flaw Detector</span>
                <p className="text-muted-foreground text-[11px]">
                  Flags vagueness, filler phrasing, missing output schemas, and hallucinations.
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
                <span className="font-semibold text-foreground">Iterative Rewriter</span>
                <p className="text-muted-foreground text-[11px]">
                  Synthesizes structured roles, format guards, and targeted compression.
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
                <span className="font-semibold text-foreground">Judge & Validator</span>
                <p className="text-muted-foreground text-[11px]">
                  Scores responses across 7 rubric axes and measures end-to-end latency.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: PROMPT ENGINE DEEP DIVE                                  */}
        {/* ============================================================== */}
        <TabsContent value="prompts" className="space-y-4">
          <Card className="p-6 shadow-none space-y-4">
            <h3 className="text-base font-semibold">How Prompt Optimization Works</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              LLMs are sensitive to syntactic structure, instruction ordering, and implicit
              assumptions. PromptIQ applies a four-stage optimization loop:
            </p>

            <div className="space-y-4 pt-2">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Stage 1
                  </Badge>
                  <h4 className="text-sm font-semibold">Heuristic Lexical Analysis</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The input prompt is parsed for filler language ("please", "kindly", "I was
                  wondering if"), vague quantifiers ("stuff", "things", "maybe"), and unspecified
                  deliverables. This produces an initial flaw severity profile and token baseline.
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Stage 2
                  </Badge>
                  <h4 className="text-sm font-semibold">Role & Schema Injection</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Based on the selected Task Type (e.g. Coding, Research, Summarization), PromptIQ
                  establishes an authoritative persona, explicitly separates background context from
                  actionable instructions, and specifies strict output formats (such as JSON schemas
                  or bullet hierarchies).
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Stage 3
                  </Badge>
                  <h4 className="text-sm font-semibold">Negative Constraint Enforcement</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hallucinations frequently occur when models attempt to fill missing context.
                  PromptIQ inserts explicit uncertainty handling ("If information is missing, state
                  so explicitly rather than guessing") and strict word/token limits.
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Stage 4
                  </Badge>
                  <h4 className="text-sm font-semibold">Semantic Cosine Preservation Check</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To ensure the optimized prompt has not mutated user intent, the system computes
                  vector cosine similarity between original and optimized semantic representations.
                  Optimization is rejected if similarity drops below 0.85.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: QUERY ENGINE DEEP DIVE                                   */}
        {/* ============================================================== */}
        <TabsContent value="queries" className="space-y-4">
          <Card className="p-6 shadow-none space-y-4">
            <h3 className="text-base font-semibold">Query Optimization Strategies</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              PromptIQ provides specialized query compilers across three critical retrieval
              paradigms:
            </p>

            <div className="grid gap-4 md:grid-cols-3 pt-2">
              <div className="rounded-lg border p-4 space-y-2 bg-muted/10">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-primary" />
                  Search Query Expansion
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Extracts high-entropy keywords, filters stopwords, resolves domain synonyms, and
                  generates boolean OR group expansions to increase recall on sparse search indexes.
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-2 bg-muted/10">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-teal-600" />
                  RAG Pipeline Calibration
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Rewrites multi-sentence conversational questions into dense semantic retrieval
                  queries, calibrates Top-K chunk sizes, and filters noise below similarity
                  thresholds.
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-2 bg-muted/10">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-amber-600" />
                  SQL AST Optimization
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Eliminates unindexed functions on filtered columns (e.g., YEAR(date)), replaces
                  broad SELECT * table scans with required columns, and generates covering index
                  DDL.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 4: METRICS & RUBRICS                                        */}
        {/* ============================================================== */}
        <TabsContent value="metrics" className="space-y-4">
          <Card className="p-6 shadow-none space-y-4">
            <div>
              <h3 className="text-base font-semibold">
                Understanding Evaluation Rubric Dimensions
              </h3>
              <p className="text-xs text-muted-foreground">
                PromptIQ evaluates prompt and query outcomes across 7 distinct dimensions:
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-2 text-xs">
              <div className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Relevance</span>
                  <Badge variant="outline" className="text-[10px]">
                    LLM Judge
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Measures whether the generation directly answers the core question without
                  introducing unrelated subjects or tangential narrative.
                </p>
              </div>

              <div className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Correctness</span>
                  <Badge variant="secondary" className="text-[10px]">
                    Deterministic Check
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Exact-match and semantic assertion verification against golden reference answers
                  provided in benchmark test sets.
                </p>
              </div>

              <div className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Completeness</span>
                  <Badge variant="outline" className="text-[10px]">
                    LLM Judge
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Evaluates coverage of all requested sub-topics, edge cases, and required
                  structural sections.
                </p>
              </div>

              <div className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Clarity</span>
                  <Badge variant="outline" className="text-[10px]">
                    Human & Heuristic
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Scores readability, logical paragraph flow, bullet organization, and elimination
                  of confusing jargon.
                </p>
              </div>

              <div className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Instruction Following</span>
                  <Badge variant="secondary" className="text-[10px]">
                    Deterministic Check
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Automated validation that all negative constraints, word count boundaries, and
                  output format schemas were strictly obeyed.
                </p>
              </div>

              <div className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Groundedness</span>
                  <Badge variant="outline" className="text-[10px]">
                    LLM Judge
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  The percentage of factual claims in the completion that are verifiable by
                  retrieved RAG source context chunks.
                </p>
              </div>

              <div className="rounded-lg border p-3 space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between font-semibold">
                  <span>Semantic Preservation</span>
                  <Badge variant="secondary" className="text-[10px]">
                    Cosine Similarity
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Embedding similarity verifying that the optimizer did not drift away from the
                  user's intended goal while refining phrasing.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 5: FASTAPI BACKEND SPECIFICATION                           */}
        {/* ============================================================== */}
        <TabsContent value="api" className="space-y-4">
          <Card className="p-6 shadow-none space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">FastAPI Endpoints Reference</h3>
                <p className="text-xs text-muted-foreground">
                  Base URL:{" "}
                  <code className="font-mono text-primary">http://localhost:8000/api/v1</code>
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                OpenAPI 3.1 Compliant
              </Badge>
            </div>

            {/* Endpoints Table */}
            <div className="rounded-lg border overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="p-2.5 font-semibold">Method</th>
                    <th className="p-2.5 font-semibold">Path</th>
                    <th className="p-2.5 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  <tr>
                    <td className="p-2.5 text-blue-600 font-bold">POST</td>
                    <td className="p-2.5">/api/v1/analyze</td>
                    <td className="p-2.5 font-sans text-muted-foreground">
                      Analyze input prompt flaws and indicators
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-emerald-600 font-bold">POST</td>
                    <td className="p-2.5">/api/v1/optimize/prompt</td>
                    <td className="p-2.5 font-sans text-muted-foreground">
                      Run prompt rewrite and optimization loop
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-emerald-600 font-bold">POST</td>
                    <td className="p-2.5">/api/v1/optimize/query</td>
                    <td className="p-2.5 font-sans text-muted-foreground">
                      Optimize search, RAG, or SQL query
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-purple-600 font-bold">GET</td>
                    <td className="p-2.5">/api/v1/experiments</td>
                    <td className="p-2.5 font-sans text-muted-foreground">
                      List all experiments with telemetry
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-blue-600 font-bold">POST</td>
                    <td className="p-2.5">/api/v1/experiments</td>
                    <td className="p-2.5 font-sans text-muted-foreground">
                      Create a new experiment configuration
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-purple-600 font-bold">GET</td>
                    <td className="p-2.5">/api/v1/experiments/&#123;id&#125;/metrics</td>
                    <td className="p-2.5 font-sans text-muted-foreground">
                      Retrieve full rubric evaluation metrics
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-purple-600 font-bold">GET</td>
                    <td className="p-2.5">/api/v1/dashboard/summary</td>
                    <td className="p-2.5 font-sans text-muted-foreground">
                      Dashboard KPI totals and chart series
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-purple-600 font-bold">GET</td>
                    <td className="p-2.5">/api/v1/health</td>
                    <td className="p-2.5 font-sans text-muted-foreground">
                      Service liveness and provider readiness
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Python Integration Snippet */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                  Python Integration Example
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() =>
                    copyCode(
                      `import requests\n\nBASE_URL = "http://localhost:8000/api/v1"\n\n# Optimize a prompt\nresponse = requests.post(f"{BASE_URL}/optimize/prompt", json={\n    "prompt": "Summarize this technical article for engineers.",\n    "taskType": "Summarization",\n    "model": "gpt-4o-mini",\n    "strategy": "Balanced",\n    "maxIterations": 2,\n    "outputLength": "short",\n    "temperature": 0.7\n})\nprint(response.json()["optimizedPrompt"])`,
                      "Python",
                    )
                  }
                >
                  <Copy className="mr-1 h-3 w-3" /> Copy Python
                </Button>
              </div>

              <pre className="rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed overflow-x-auto">
                {`import requests

BASE_URL = "http://localhost:8000/api/v1"

# Optimize a prompt
response = requests.post(f"{BASE_URL}/optimize/prompt", json={
    "prompt": "Summarize this technical article for engineers.",
    "taskType": "Summarization",
    "model": "gpt-4o-mini",
    "strategy": "Balanced",
    "maxIterations": 2,
    "outputLength": "short",
    "temperature": 0.7
})
print(response.json()["optimizedPrompt"])`}
              </pre>
            </div>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 6: FAQ & TROUBLESHOOTING                                    */}
        {/* ============================================================== */}
        <TabsContent value="faq" className="space-y-4">
          <Card className="p-6 shadow-none space-y-4">
            <h3 className="text-base font-semibold">
              Frequently Asked Questions & Troubleshooting
            </h3>

            <Accordion type="single" collapsible className="w-full text-xs">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xs font-semibold">
                  How does PromptIQ run without a connected backend?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  PromptIQ includes an in-browser deterministic simulation adapter. It performs
                  rule-based lexical flaw detection, structured role injection, and generates
                  realistic benchmark telemetry using seeded random distributions so developers can
                  explore all 10 pages immediately.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-xs font-semibold">
                  Where should I store provider API keys (OpenAI, Anthropic)?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Never put secret API keys in browser configuration or client-side code. When
                  connecting to a real deployment, set your keys as environment variables on your
                  FastAPI server (e.g., OPENAI_API_KEY=sk-...). PromptIQ calls the backend proxy,
                  keeping your secrets safe.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-xs font-semibold">
                  What should I do if an SQL query optimization suggests an index?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Copy the recommended CREATE INDEX DDL statement from Query Lab. Validate it with
                  your database administrator or test it on a non-production staging replica to
                  ensure it doesn't degrade write latency on high-throughput tables.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-xs font-semibold">
                  Why are LLM-as-a-judge scores marked as non-ground truth?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  LLMs evaluate responses using probabilistic rubrics and can exhibit position bias,
                  self-enhancement bias, or subtle variance. PromptIQ explicitly differentiates
                  between deterministic test suites (exact match, JSON schema validity) and model
                  judge ratings.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-xs font-semibold">
                  How do I switch from Demo mode to my live FastAPI server?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  In Settings under Model Configuration, click the "Test Connection" button. If your
                  FastAPI backend is running at http://localhost:8000, PromptIQ will connect to the
                  live API endpoints automatically. You can also toggle the mode badge in the top
                  header.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

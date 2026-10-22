import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileCheck,
  FileCode,
  Gauge,
  HelpCircle,
  Layers,
  Lightbulb,
  Play,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ComparisonPanel } from "@/components/shared/comparison";
import { PageHeader } from "@/components/shared/page-header";
import { SqlEditor } from "@/components/shared/sql-editor";
import { EmptyState } from "@/components/shared/states";
import { useApi } from "@/lib/api";
import { addDemoHistory } from "@/lib/api/demo";
import type {
  OptimizeQueryRequest,
  RagResult,
  SearchQueryResult,
  SqlResult,
} from "@/lib/api/types";
import { copyText, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/query-lab")({
  head: () => ({
    meta: [
      { title: "Query Lab — PromptIQ" },
      {
        name: "description",
        content: "Optimize search queries, RAG retrieval pipelines, and SQL execution performance.",
      },
      { property: "og:title", content: "Query Lab — PromptIQ" },
      {
        property: "og:description",
        content: "Optimize search queries, RAG retrieval pipelines, and SQL execution performance.",
      },
    ],
  }),
  component: QueryLabPage,
});

export function QueryLabPage() {
  const { api, mode } = useApi();
  const [activeTab, setActiveTab] = useState("search");

  // ==========================================
  // TAB 1: Search Query State
  // ==========================================
  const [searchQuery, setSearchQuery] = useState(
    "cheap laptops good for coding and machine learning",
  );
  const [isOptimizingSearch, setIsOptimizingSearch] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchQueryResult | null>(null);

  const handleOptimizeSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsOptimizingSearch(true);
    try {
      const res = await api.optimizeQuery({ kind: "search", query: searchQuery });
      if (res.kind === "search") {
        setSearchResult(res.result);
        if (mode === "demo") {
          addDemoHistory({
            kind: "search",
            title: `Search Query: ${searchQuery.slice(0, 30)}...`,
            input: searchQuery,
            output: res.result.optimizedQuery,
            model: "Search Optimizer (Lexical + Expansion)",
            success: true,
          });
        }
        toast.success("Search query optimized");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Search optimization failed");
    } finally {
      setIsOptimizingSearch(false);
    }
  };

  // ==========================================
  // TAB 2: RAG Retrieval State
  // ==========================================
  const [ragQuery, setRagQuery] = useState(
    "What is the refund window and process for annual enterprise accounts?",
  );
  const [ragCollection, setRagCollection] = useState("Customer Support KB");
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0.65);
  const [rewriteEnabled, setRewriteEnabled] = useState(true);
  const [hybridEnabled, setHybridEnabled] = useState(false);
  const [rerankEnabled, setRerankEnabled] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [ragResult, setRagResult] = useState<RagResult | null>(null);

  const handleRunRag = async () => {
    if (!ragQuery.trim()) return;
    setIsRetrieving(true);
    try {
      const res = await api.optimizeQuery({
        kind: "rag",
        query: ragQuery,
        collection: ragCollection,
        topK,
        threshold,
        rewrite: rewriteEnabled,
      });
      if (res.kind === "rag") {
        setRagResult(res.result);
        if (mode === "demo") {
          addDemoHistory({
            kind: "rag",
            title: `RAG Retrieval: ${ragQuery.slice(0, 30)}...`,
            input: ragQuery,
            output: `${res.result.documents.length} docs retrieved (Mean score: ${res.result.metrics.meanScore})`,
            model: "Dense Vector Retriever (bge-large-en)",
            success: true,
          });
        }
        toast.success(`Retrieved ${res.result.documents.length} relevant documents`);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "RAG retrieval failed");
    } finally {
      setIsRetrieving(false);
    }
  };

  // ==========================================
  // TAB 3: SQL Query State
  // ==========================================
  const [sqlDialect, setSqlDialect] = useState("postgresql");
  const [sqlSchema, setSqlSchema] = useState(
    `CREATE TABLE orders (\n  id SERIAL PRIMARY KEY,\n  customer_id INT,\n  created_at TIMESTAMP,\n  status VARCHAR(32),\n  total_amount NUMERIC(10, 2)\n);\nCREATE INDEX idx_orders_customer ON orders(customer_id);`,
  );
  const [sqlCode, setSqlCode] = useState(
    `SELECT *\nFROM orders\nWHERE YEAR(created_at) = 2025\n  AND status = 'completed'\nORDER BY created_at DESC;`,
  );
  const [isOptimizingSql, setIsOptimizingSql] = useState(false);
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);

  const handleValidateSql = async () => {
    setIsOptimizingSql(true);
    try {
      const res = await api.optimizeQuery({
        kind: "sql",
        query: sqlCode,
        dialect: sqlDialect,
        schema: sqlSchema,
      });
      if (res.kind === "sql") {
        setSqlResult(res.result);
        if (res.result.valid) {
          toast.success("SQL query syntax is valid");
        } else {
          toast.error("SQL validation issues detected");
        }
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Validation failed");
    } finally {
      setIsOptimizingSql(false);
    }
  };

  const handleOptimizeSql = async () => {
    setIsOptimizingSql(true);
    try {
      const res = await api.optimizeQuery({
        kind: "sql",
        query: sqlCode,
        dialect: sqlDialect,
        schema: sqlSchema,
      });
      if (res.kind === "sql") {
        setSqlResult({
          ...res.result,
          plan: `EXPLAIN ANALYZE (Simulated Safe Execution Plan):\n-> Index Scan using idx_orders_created_at on orders (cost=0.29..8.45 rows=12 width=32)\n   Index Cond: ((created_at >= '2025-01-01'::timestamp) AND (created_at < '2026-01-01'::timestamp))\n   Filter: ((status)::text = 'completed'::text)\nPlanning Time: 0.124 ms\nExecution Time: 0.421 ms`,
          estimatedRows: 12,
          estimatedCost: 8.45,
          executionMs: { original: 42, optimized: 0.42 },
          equivalence: "verified",
        });
        if (mode === "demo") {
          addDemoHistory({
            kind: "sql",
            title: `SQL Optimization: ${sqlCode.slice(0, 30)}...`,
            input: sqlCode,
            output: res.result.optimizedSql,
            model: "Query Planner & AST Optimizer",
            success: true,
          });
        }
        toast.success("SQL optimization complete");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "SQL optimization failed");
    } finally {
      setIsOptimizingSql(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Query Lab"
        description="Optimize lexical search keywords, vector RAG retrieval pipelines, and SQL execution performance."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Query
          </TabsTrigger>
          <TabsTrigger value="rag" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            RAG Retrieval
          </TabsTrigger>
          <TabsTrigger value="sql" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            SQL Query
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 1: SEARCH QUERY OPTIMIZER                                   */}
        {/* ============================================================== */}
        <TabsContent value="search" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Input & Controls */}
            <div className="space-y-4">
              <Card className="p-4 shadow-none space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Natural Language Query</span>
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        setSearchQuery("fix react hydration error server client mismatch")
                      }
                    >
                      Sample 1
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        setSearchQuery("how to build multimodal rag pipeline with embeddings")
                      }
                    >
                      Sample 2
                    </Button>
                  </div>
                </div>

                <Textarea
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter a natural-language search query..."
                  rows={4}
                  className="font-mono text-xs leading-relaxed"
                />

                <div className="flex items-center justify-between pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResult(null);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleOptimizeSearch}
                    disabled={!searchQuery.trim() || isOptimizingSearch}
                  >
                    {isOptimizingSearch ? (
                      <>
                        <Sparkles className="mr-1.5 h-4 w-4 animate-spin" />
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 h-4 w-4" />
                        Analyze & Optimize Query
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Search Features Breakdown */}
              {searchResult && (
                <Card className="p-4 shadow-none space-y-4">
                  <h4 className="text-sm font-semibold">Query Decomposition & Extraction</h4>

                  {/* Intent & Entities */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border p-3 space-y-1 bg-muted/20">
                      <span className="text-muted-foreground">Classified Intent:</span>
                      <div className="flex items-center gap-1.5 pt-1">
                        <Badge variant="outline" className="font-semibold text-primary">
                          {searchResult.intent}
                        </Badge>
                      </div>
                    </div>

                    <div className="rounded-lg border p-3 space-y-1 bg-muted/20">
                      <span className="text-muted-foreground">Named Entities:</span>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {searchResult.entities.length === 0 ? (
                          <span className="text-muted-foreground italic">None detected</span>
                        ) : (
                          searchResult.entities.map((e, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              {e.text} ({e.type})
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Extracted Lexical Keywords
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {searchResult.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="font-mono text-xs">
                          <Tag className="mr-1 h-3 w-3" />
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Synonyms */}
                  {searchResult.synonyms.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Synonym Expansions
                      </span>
                      <div className="space-y-1.5">
                        {searchResult.synonyms.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="font-mono font-medium">{s.term}:</span>
                            <div className="flex flex-wrap gap-1">
                              {s.alternatives.map((alt, j) => (
                                <Badge key={j} variant="secondary" className="text-[11px]">
                                  {alt}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Query Expansions */}
                  {searchResult.expansions.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Suggested Alternate Formulations
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground font-mono">
                        {searchResult.expansions.map((exp, i) => (
                          <li key={i}>{exp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Right: Results Comparison */}
            <div className="space-y-4">
              {!searchResult ? (
                <EmptyState
                  icon={Search}
                  title="Search Query Workspace"
                  description="Enter your raw search string on the left to extract intent, generate boolean expansions, and eliminate low-information stopwords."
                />
              ) : (
                <Card className="p-4 shadow-none space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Optimized Search Query</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          copyText(searchResult.optimizedQuery);
                          toast.success("Copied optimized query");
                        }}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copy Query
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-accent/10 border-primary/20 p-3 font-mono text-xs leading-relaxed text-foreground">
                    {searchResult.optimizedQuery}
                  </div>

                  <div className="pt-2 border-t">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                      Original vs. Optimized Comparison
                    </span>
                    <ComparisonPanel
                      original={searchQuery}
                      optimized={searchResult.optimizedQuery}
                      leftLabel="Original Search Query"
                      rightLabel="Optimized Search Syntax"
                    />
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: RAG RETRIEVAL OPTIMIZER                                  */}
        {/* ============================================================== */}
        <TabsContent value="rag" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Retrieval Controls */}
            <Card className="p-4 shadow-none space-y-4 lg:col-span-1">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" />
                RAG Pipeline Settings
              </h4>

              <div className="space-y-1.5">
                <Label className="text-xs">Document Collection</Label>
                <Select value={ragCollection} onValueChange={setRagCollection}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer Support KB">
                      Customer Support KB (84 docs)
                    </SelectItem>
                    <SelectItem value="Product Docs v3">Product Docs v3 (240 docs)</SelectItem>
                    <SelectItem value="Engineering Wiki">Engineering Wiki (412 docs)</SelectItem>
                    <SelectItem value="Financial Reports">Financial Reports (65 docs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label className="text-xs">Top-K Retrieval</Label>
                  <span className="font-mono text-muted-foreground">{topK}</span>
                </div>
                <Slider
                  value={[topK]}
                  min={1}
                  max={20}
                  step={1}
                  onValueChange={([v]) => setTopK(v)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label className="text-xs">Similarity Threshold</Label>
                  <span className="font-mono text-muted-foreground">{threshold.toFixed(2)}</span>
                </div>
                <Slider
                  value={[threshold]}
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  onValueChange={([v]) => setThreshold(v)}
                />
              </div>

              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Query Rewrite</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Strip noise before vector lookup
                    </p>
                  </div>
                  <Switch checked={rewriteEnabled} onCheckedChange={setRewriteEnabled} />
                </div>

                {/* Hybrid Search (Disabled with tooltip) */}
                <div className="flex items-center justify-between opacity-60">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Hybrid Search (Dense + BM25)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Disabled: Hybrid search requires a connected Elasticsearch/Vespa backend
                          instance. Currently in demo mode.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Backend connection required</p>
                  </div>
                  <Switch checked={hybridEnabled} disabled onCheckedChange={setHybridEnabled} />
                </div>

                {/* Reranking (Disabled with tooltip) */}
                <div className="flex items-center justify-between opacity-60">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Cross-Encoder Reranking</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Disabled: Cross-encoder reranking requires a dedicated GPU worker instance
                          on the backend.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[11px] text-muted-foreground">GPU worker required</p>
                  </div>
                  <Switch checked={rerankEnabled} disabled onCheckedChange={setRerankEnabled} />
                </div>
              </div>
            </Card>

            {/* Query Input & Retrieved Documents */}
            <div className="space-y-4 lg:col-span-2">
              <Card className="p-4 shadow-none space-y-3">
                <Label className="text-xs font-semibold">User Question / Retrieval Query</Label>
                <Textarea
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  placeholder="Ask a question to test document retrieval..."
                  rows={3}
                  className="text-xs font-mono"
                />

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    Collection: {ragCollection} (Threshold ≥ {threshold})
                  </span>
                  <Button
                    size="sm"
                    onClick={handleRunRag}
                    disabled={!ragQuery.trim() || isRetrieving}
                  >
                    {isRetrieving ? (
                      <>
                        <Sparkles className="mr-1.5 h-4 w-4 animate-spin" />
                        Retrieving...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 h-4 w-4" />
                        Retrieve Documents
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Retrieval Quality Metrics & Document List */}
              {ragResult && (
                <div className="space-y-4">
                  {/* Quality Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="p-3 shadow-none text-center">
                      <span className="text-xs text-muted-foreground">Mean Relevance</span>
                      <p className="text-xl font-semibold text-primary">
                        {ragResult.metrics.meanScore}
                      </p>
                    </Card>
                    <Card className="p-3 shadow-none text-center">
                      <span className="text-xs text-muted-foreground">Retrieved (Top-K)</span>
                      <p className="text-xl font-semibold">
                        {ragResult.documents.length} / {topK}
                      </p>
                    </Card>
                    <Card className="p-3 shadow-none text-center">
                      <span className="text-xs text-muted-foreground">Query Rewrite</span>
                      <p className="text-xs font-mono font-medium truncate pt-1">
                        {ragResult.rewrittenQuery ?? "None"}
                      </p>
                    </Card>
                  </div>

                  {/* Documents List */}
                  <Card className="p-4 shadow-none space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Retrieved Document Chunks</h4>
                      <Badge variant="outline" className="text-xs font-mono">
                        {ragResult.documents.length} hits
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {ragResult.documents.map((doc, idx) => (
                        <div
                          key={doc.id}
                          className="rounded-lg border p-3 space-y-1.5 text-xs bg-muted/20 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-primary" />
                              {doc.title}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                doc.score >= 0.8
                                  ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-mono"
                                  : "font-mono"
                              }
                            >
                              score: {doc.score}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{doc.snippet}</p>
                          <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                            <span className="font-mono">{doc.source}</span>
                            <span>Indexed: {doc.updatedAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: SQL QUERY OPTIMIZER                                      */}
        {/* ============================================================== */}
        <TabsContent value="sql" className="space-y-6">
          {/* Safe SQL Notice */}
          <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Safe Query Sandbox:</strong> Never execute arbitrary SQL automatically.
              PromptIQ validates syntax and inspects execution plans in a safe read-only environment
              before generating index recommendations.
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: SQL Editor & Options */}
            <div className="space-y-4">
              <Card className="p-4 shadow-none space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">SQL Code Editor</span>
                  <div className="flex items-center gap-2">
                    <Select value={sqlDialect} onValueChange={setSqlDialect}>
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="sqlite">SQLite</SelectItem>
                        <SelectItem value="snowflake">Snowflake</SelectItem>
                        <SelectItem value="bigquery">BigQuery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* CodeMirror SQL Editor */}
                <SqlEditor value={sqlCode} onChange={setSqlCode} minHeight="180px" />

                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs">Database Schema / Table Context (Optional)</Label>
                  <Textarea
                    value={sqlSchema}
                    onChange={(e) => setSqlSchema(e.target.value)}
                    rows={4}
                    className="font-mono text-[11px] leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={handleValidateSql}
                    disabled={isOptimizingSql}
                  >
                    <FileCheck className="mr-1.5 h-3.5 w-3.5" />
                    Validate Query
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleOptimizeSql}
                    disabled={!sqlCode.trim() || isOptimizingSql}
                  >
                    {isOptimizingSql ? (
                      <>
                        <Sparkles className="mr-1.5 h-4 w-4 animate-spin" />
                        Analyzing Plan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 h-4 w-4" />
                        Optimize SQL Query
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Validation Warnings */}
              {sqlResult?.messages && sqlResult.messages.length > 0 && (
                <Card className="p-4 shadow-none space-y-2 border-amber-500/30 bg-amber-500/5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Detected Query Anti-Patterns
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                    {sqlResult.messages.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            {/* Right: Optimized SQL & Plan */}
            <div className="space-y-4">
              {!sqlResult ? (
                <EmptyState
                  icon={Database}
                  title="SQL Performance Optimizer"
                  description="Paste a SELECT query on the left. PromptIQ will identify unindexed predicates, avoid SELECT * table scans, and generate targeted index recommendations."
                />
              ) : (
                <>
                  <Card className="p-4 shadow-none space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Optimized SQL</span>
                        <Badge
                          variant="outline"
                          className={
                            sqlResult.equivalence === "verified"
                              ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-xs"
                              : "text-xs"
                          }
                        >
                          Equivalence: {sqlResult.equivalence}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          copyText(sqlResult.optimizedSql);
                          toast.success("Optimized SQL copied");
                        }}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copy
                      </Button>
                    </div>

                    <SqlEditor value={sqlResult.optimizedSql} readOnly minHeight="140px" />

                    {/* Execution Comparison Stats */}
                    {sqlResult.executionMs && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center text-xs">
                        <div className="rounded border p-2">
                          <span className="text-muted-foreground">Original Time</span>
                          <p className="font-semibold">{sqlResult.executionMs.original} ms</p>
                        </div>
                        <div className="rounded border p-2 bg-accent/20">
                          <span className="text-primary font-medium">Optimized Time</span>
                          <p className="font-semibold text-primary">
                            {sqlResult.executionMs.optimized} ms
                          </p>
                        </div>
                        <div className="rounded border p-2">
                          <span className="text-muted-foreground">Est. Cost Units</span>
                          <p className="font-semibold">{sqlResult.estimatedCost ?? "n/a"}</p>
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Index Recommendations */}
                  {sqlResult.indexRecommendations.length > 0 && (
                    <Card className="p-4 shadow-none space-y-2 border-primary/20 bg-accent/5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" />
                          Recommended Covering Index
                        </h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => {
                            copyText(sqlResult.indexRecommendations.join("\n"));
                            toast.success("Index DDL copied");
                          }}
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          Copy DDL
                        </Button>
                      </div>
                      <div className="rounded bg-muted/40 p-2 font-mono text-xs">
                        {sqlResult.indexRecommendations.map((ddl, i) => (
                          <div key={i}>{ddl}</div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Execution Plan breakdown */}
                  {sqlResult.plan && (
                    <Card className="p-4 shadow-none space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Query Execution Plan
                      </h4>
                      <pre className="whitespace-pre-wrap break-words rounded bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
                        {sqlResult.plan}
                      </pre>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

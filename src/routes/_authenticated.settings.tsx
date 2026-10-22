import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Key,
  Layers,
  Lock,
  Moon,
  Power,
  RefreshCw,
  Save,
  Server,
  Shield,
  Sliders,
  Sun,
  Trash2,
  User,
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
import { ConfirmDialog } from "@/components/shared/misc";
import { ModelSelector } from "@/components/shared/model-selector";
import { PageHeader } from "@/components/shared/page-header";
import { useApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import type { PromptTaskType, Strategy } from "@/lib/api/types";
import { downloadFile } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — PromptIQ" },
      {
        name: "description",
        content:
          "Configure application defaults, model credentials, optimization rubrics, and data retention.",
      },
      { property: "og:title", content: "Settings — PromptIQ" },
      {
        property: "og:description",
        content:
          "Configure application defaults, model credentials, optimization rubrics, and data retention.",
      },
    ],
  }),
  component: SettingsPage,
});

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, update, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { api, mode, setMode } = useApi();

  // General state
  const [name, setName] = useState(user?.name || "Dev User");
  const [email, setEmail] = useState(user?.email || "dev@promptiq.ai");
  const [defaultTask, setDefaultTask] = useState<PromptTaskType>("General");
  const [defaultStrategy, setDefaultStrategy] = useState<Strategy>("Balanced");

  // Model config state
  const [defaultProvider, setDefaultProvider] = useState("OpenAI");
  const [defaultModel, setDefaultModel] = useState("gpt-4o-mini");
  const [defaultTemp, setDefaultTemp] = useState(0.7);
  const [defaultMaxTokens, setDefaultMaxTokens] = useState(1024);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Optimization settings state
  const [maxIterations, setMaxIterations] = useState(3);
  const [qualityThreshold, setQualityThreshold] = useState(75);
  const [semanticThreshold, setSemanticThreshold] = useState(85);
  const [cachingEnabled, setCachingEnabled] = useState(true);
  const [latencyWeight, setLatencyWeight] = useState(50); // 0 (cost priority) to 100 (latency priority)

  // Evaluation settings state
  const [defaultEvaluator, setDefaultEvaluator] = useState("llm_judge");
  const [rubricStrictness, setRubricStrictness] = useState("standard");
  const [referenceDataset, setReferenceDataset] = useState("Customer FAQ v2");
  const [minAcceptableQuality, setMinAcceptableQuality] = useState(70);

  // Data & Privacy
  const [retentionDays, setRetentionDays] = useState("90");
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    update({ name, email });
    toast.success("General profile preferences saved");
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setHealthStatus(null);
    try {
      const res = await api.health();
      if (res.ok) {
        setHealthStatus({
          ok: true,
          message: `FastAPI backend connected successfully (v${res.version || "1.0"})`,
        });
        toast.success("Backend connection verified");
      } else {
        setHealthStatus({
          ok: false,
          message:
            "FastAPI server at http://localhost:8000 is not reachable. Using simulated demo adapter.",
        });
        toast.error("Backend server offline — running in demo mode");
      }
    } catch (e: unknown) {
      setHealthStatus({
        ok: false,
        message: `Connection error: ${e instanceof Error ? e.message : "Failed to reach http://localhost:8000"}`,
      });
      toast.error("Backend connection test failed");
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleExportUserData = () => {
    const data = {
      user: { name, email },
      preferences: {
        defaultTask,
        defaultStrategy,
        defaultModel,
        defaultTemp,
        qualityThreshold,
        semanticThreshold,
        cachingEnabled,
      },
      exportedAt: new Date().toISOString(),
    };
    downloadFile("promptiq-user-settings.json", JSON.stringify(data, null, 2), "application/json");
    toast.success("User configuration data exported");
  };

  const handleClearHistory = async () => {
    await api.clearHistory();
    toast.success("All optimization history deleted");
    setClearHistoryOpen(false);
  };

  const handleDeleteAccount = () => {
    signOut();
    localStorage.clear();
    toast.info("Account data reset. Redirecting to sign in...");
    navigate({ to: "/login" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure application defaults, server-side model connections, optimization parameters, and security policies."
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 max-w-2xl">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="model">Model Config</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
          <TabsTrigger value="privacy">Data & Privacy</TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 1: GENERAL SETTINGS                                         */}
        {/* ============================================================== */}
        <TabsContent value="general" className="space-y-4">
          <Card className="p-4 shadow-none sm:p-6">
            <h3 className="text-base font-semibold mb-1">User Profile & Interface</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Manage your display identity and interface presentation.
            </p>

            <form onSubmit={handleSaveGeneral} className="space-y-4 max-w-lg">
              <div className="space-y-1.5">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="display-email">Email Address</Label>
                <Input
                  id="display-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Theme Preference</Label>
                <Select
                  value={theme}
                  onValueChange={(t: "light" | "dark" | "system") => setTheme(t)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="system">System Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <Label>Default Task Type</Label>
                  <Select
                    value={defaultTask}
                    onValueChange={(v: PromptTaskType) => setDefaultTask(v)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Coding">Coding</SelectItem>
                      <SelectItem value="Research">Research</SelectItem>
                      <SelectItem value="Summarization">Summarization</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Data Analysis">Data Analysis</SelectItem>
                      <SelectItem value="Writing">Writing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Default Strategy</Label>
                  <Select
                    value={defaultStrategy}
                    onValueChange={(v: Strategy) => setDefaultStrategy(v)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Balanced">Balanced</SelectItem>
                      <SelectItem value="Quality First">Quality First</SelectItem>
                      <SelectItem value="Low Cost">Low Cost</SelectItem>
                      <SelectItem value="Low Latency">Low Latency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-3">
                <Button type="submit" size="sm">
                  <Save className="mr-1.5 h-4 w-4" /> Save General Settings
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: MODEL CONFIGURATION                                      */}
        {/* ============================================================== */}
        <TabsContent value="model" className="space-y-4">
          <Card className="p-4 shadow-none sm:p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold">Model Providers & Backend Connection</h3>
              <p className="text-xs text-muted-foreground">
                PromptIQ connects to a central FastAPI service. Secret API keys are managed
                server-side.
              </p>
            </div>

            {/* Security Notice: Keys are Server-Side */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-blue-900 dark:text-blue-200">
              <Lock className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold">
                  Security Architecture: Zero Browser-Side Secrets
                </span>
                <p className="text-muted-foreground dark:text-blue-300">
                  To protect API credentials, keys for OpenAI, Anthropic, Google, and self-hosted
                  endpoints are loaded into the FastAPI backend environment (via .env or cloud
                  secret managers). They are never saved into browser local storage or transmitted
                  to the client.
                </p>
              </div>
            </div>

            {/* Provider Status Table */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Configured Model Providers
              </Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  {
                    name: "OpenAI",
                    status: "Configured via backend",
                    models: "gpt-4o, gpt-4o-mini",
                  },
                  {
                    name: "Anthropic",
                    status: "Configured via backend",
                    models: "claude-3.5-sonnet",
                  },
                  { name: "Google", status: "Configured via backend", models: "gemini-1.5-pro" },
                  { name: "Meta (vLLM)", status: "Local worker endpoint", models: "llama-3.1-70b" },
                  {
                    name: "Groq (PromptCowboy)",
                    status: "LPU Engine (~800 tok/s)",
                    models: "llama-3.3-70b-versatile",
                  },
                ].map((p) => (
                  <div key={p.name} className="rounded-lg border p-3 space-y-1 text-xs bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{p.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        Active
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px]">{p.status}</p>
                    <span className="font-mono text-[10px] text-muted-foreground block">
                      {p.models}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generation Parameters */}
            <div className="grid gap-4 sm:grid-cols-2 max-w-lg pt-3 border-t">
              <div className="space-y-1.5">
                <Label className="text-xs">Default Model</Label>
                <ModelSelector value={defaultModel} onChange={setDefaultModel} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Max Generated Tokens</Label>
                <Input
                  type="number"
                  value={defaultMaxTokens}
                  onChange={(e) => setDefaultMaxTokens(+e.target.value)}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            {/* Connection Test with Real Health Endpoint */}
            <div className="rounded-lg border p-4 space-y-3 bg-muted/10">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <Server className="h-4 w-4 text-primary" />
                    FastAPI Backend Connection Check
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    Endpoint: http://localhost:8000/api/v1/health
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = mode === "demo" ? "live" : "demo";
                      setMode(next);
                      toast.info(`Switched to ${next.toUpperCase()} mode`);
                    }}
                  >
                    Mode: {mode.toUpperCase()}
                  </Button>
                  <Button size="sm" onClick={handleTestConnection} disabled={isTestingConnection}>
                    {isTestingConnection ? (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                </div>
              </div>

              {healthStatus && (
                <div
                  className={`rounded-lg border p-3 text-xs flex items-center gap-2 ${
                    healthStatus.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                  }`}
                >
                  {healthStatus.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <span>{healthStatus.message}</span>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: OPTIMIZATION SETTINGS                                    */}
        {/* ============================================================== */}
        <TabsContent value="optimization" className="space-y-4">
          <Card className="p-4 shadow-none sm:p-6 space-y-5">
            <div>
              <h3 className="text-base font-semibold">Optimization Engine Thresholds</h3>
              <p className="text-xs text-muted-foreground">
                Fine-tune stopping conditions, semantic safeguards, and latency/cost trade-offs.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Max Optimization Iterations</Label>
                  <span className="font-mono text-muted-foreground">{maxIterations} loops</span>
                </div>
                <Slider
                  value={[maxIterations]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={([v]) => v !== undefined && setMaxIterations(v)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Quality Acceptance Threshold</Label>
                  <span className="font-mono text-muted-foreground">{qualityThreshold}%</span>
                </div>
                <Slider
                  value={[qualityThreshold]}
                  min={50}
                  max={95}
                  step={5}
                  onValueChange={([v]) => v !== undefined && setQualityThreshold(v)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Semantic Preservation Threshold</Label>
                  <span className="font-mono text-muted-foreground">{semanticThreshold}%</span>
                </div>
                <Slider
                  value={[semanticThreshold]}
                  min={70}
                  max={99}
                  step={1}
                  onValueChange={([v]) => v !== undefined && setSemanticThreshold(v)}
                />
                <span className="text-[11px] text-muted-foreground block">
                  Embedding similarity floor to prevent prompt drift.
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Priority Weight: Cost vs. Latency</Label>
                  <span className="font-mono text-muted-foreground">
                    {latencyWeight < 50
                      ? "Cost Focus"
                      : latencyWeight > 50
                        ? "Latency Focus"
                        : "Balanced"}
                  </span>
                </div>
                <Slider
                  value={[latencyWeight]}
                  min={0}
                  max={100}
                  step={10}
                  onValueChange={([v]) => v !== undefined && setLatencyWeight(v)}
                />
              </div>
            </div>

            <div className="pt-3 border-t max-w-2xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Semantic Prompt & Query Caching</Label>
                  <p className="text-xs text-muted-foreground">
                    Cache optimized ASTs and prompt rewrites for queries within 0.96 cosine
                    similarity.
                  </p>
                </div>
                <Switch checked={cachingEnabled} onCheckedChange={setCachingEnabled} />
              </div>
            </div>

            <Button size="sm" onClick={() => toast.success("Optimization settings updated")}>
              <Save className="mr-1.5 h-4 w-4" /> Save Engine Settings
            </Button>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 4: EVALUATION SETTINGS                                      */}
        {/* ============================================================== */}
        <TabsContent value="evaluation" className="space-y-4">
          <Card className="p-4 shadow-none sm:p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold">Evaluation Rubrics & Standards</h3>
              <p className="text-xs text-muted-foreground">
                Set baseline standards for judge rubrics, gold datasets, and pass/fail criteria.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
              <div className="space-y-1.5">
                <Label className="text-xs">Default Evaluator</Label>
                <Select value={defaultEvaluator} onValueChange={setDefaultEvaluator}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llm_judge">LLM-as-a-Judge (GPT-4o)</SelectItem>
                    <SelectItem value="deterministic">Deterministic Assertions Only</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Deterministic + LLM Judge)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Evaluation Rubric Standard</Label>
                <Select value={rubricStrictness} onValueChange={setRubricStrictness}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">Strict (Penalize format deviations)</SelectItem>
                    <SelectItem value="standard">Standard Balanced Rubric</SelectItem>
                    <SelectItem value="permissive">Permissive (Content focus only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Reference Golden Dataset</Label>
                <Select value={referenceDataset} onValueChange={setReferenceDataset}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer FAQ v2">Customer FAQ v2</SelectItem>
                    <SelectItem value="SciQA-500">SciQA-500</SelectItem>
                    <SelectItem value="Internal Docs">Internal Docs</SelectItem>
                    <SelectItem value="Northwind SQL">Northwind SQL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Min Passing Quality Score</Label>
                <Input
                  type="number"
                  value={minAcceptableQuality}
                  onChange={(e) => setMinAcceptableQuality(+e.target.value)}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            <div className="pt-3">
              <Button size="sm" onClick={() => toast.success("Evaluation parameters saved")}>
                <Save className="mr-1.5 h-4 w-4" /> Save Rubric Settings
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 5: DATA AND PRIVACY                                         */}
        {/* ============================================================== */}
        <TabsContent value="privacy" className="space-y-4">
          <Card className="p-4 shadow-none sm:p-6 space-y-5">
            <div>
              <h3 className="text-base font-semibold">Data Retention & Governance</h3>
              <p className="text-xs text-muted-foreground">
                Manage audit logs, experiment history retention, and complete data export.
              </p>
            </div>

            <div className="space-y-4 max-w-lg">
              <div className="space-y-1.5">
                <Label className="text-xs">Experiment Log Retention Policy</Label>
                <Select value={retentionDays} onValueChange={setRetentionDays}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Retain for 30 days</SelectItem>
                    <SelectItem value="90">Retain for 90 days</SelectItem>
                    <SelectItem value="365">Retain for 1 year</SelectItem>
                    <SelectItem value="forever">Indefinite storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleExportUserData}>
                  <Download className="mr-1.5 h-4 w-4" /> Export All Configuration (JSON)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setClearHistoryOpen(true)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Clear Optimization History
                </Button>
              </div>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="pt-4 border-t max-w-xl">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Danger Zone: Reset Account & Cache
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Wipes all local preview credentials, cached experiment outcomes, and restores
                    factory demo configuration.
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setDeleteAccountOpen(true)}>
                  Delete Account & Reset Data
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Clear History Confirm Dialog */}
      <ConfirmDialog
        open={clearHistoryOpen}
        onOpenChange={setClearHistoryOpen}
        title="Clear Optimization History?"
        description="Are you sure you want to delete all historical logs? This action is irreversible."
        confirmLabel="Clear Logs"
        onConfirm={handleClearHistory}
      />

      {/* Delete Account Confirm Dialog */}
      <ConfirmDialog
        open={deleteAccountOpen}
        onOpenChange={setDeleteAccountOpen}
        title="Permanently Reset Account & Data?"
        description="This will clear all saved preferences, draft prompts, and local session credentials."
        confirmLabel="Reset Account"
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}

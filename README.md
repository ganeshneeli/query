# Query Quality Compass

Build a complete, polished, responsive AI SaaS web application called "PromptIQ" for the project:

"AI-Driven Prompt and Query Optimization Framework for Enhanced LLM Response Quality and Query Performance."

IMPORTANT:
Build the actual frontend application, not just a landing page, static mockup, or design screenshot. All navigation, forms, tabs, dropdowns, editors, filters, dialogs, charts, and interactions must work.

TECHNOLOGY STACK:

- React with TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Lucide icons
- Recharts for data visualization
- React Router for navigation
- TanStack Query for server state and API requests
- React Hook Form and Zod for form validation
- Monaco Editor or CodeMirror for optional SQL/code editing
- Use a clean modular component architecture

DESIGN DIRECTION:
Create a premium AI developer-tool interface inspired by modern AI analytics products and professional developer dashboards.

Visual style:

- Primary theme: light, almost-white background
- Sidebar: white with subtle borders
- Primary text: deep navy/charcoal
- Accent color: electric indigo/violet
- Secondary accent: teal for successful optimization
- Cards: white, subtle borders, rounded-xl corners
- Shadows: minimal and refined
- Use generous spacing, clear hierarchy, and consistent alignment
- Typography: Inter or a similar clean sans-serif font
- Avoid excessive gradients, excessive glassmorphism, oversized headings, and unnecessary animations
- Use subtle transitions and tasteful Framer Motion animations only where appropriate
- Create an excellent desktop experience and fully responsive tablet/mobile layouts
- Include skeleton loaders, empty states, error states, and tooltips
- Do not use emoji as interface icons; use Lucide icons

BRAND:
Product name: PromptIQ
Tagline: "Better Prompts. Smarter Queries. Measurable Results."
Logo: a simple geometric AI/spark or connected-node icon with the PromptIQ wordmark.

APPLICATION STRUCTURE:

Create a persistent sidebar with:

1. Dashboard
2. Prompt Lab
3. Query Lab
4. Evaluation Studio
5. Experiments
6. History
7. Analytics
8. Settings

At the bottom of the sidebar:

- User profile
- Help and documentation
- Collapse sidebar button

Create a top header containing:

- Breadcrumb navigation
- Current page title
- Global search or command menu
- Notifications icon
- Theme toggle
- User avatar and profile menu

PAGE 1 — DASHBOARD

Create a professional analytics dashboard.

Header:

- Title: "Dashboard"
- Subtitle: "Monitor prompt quality, query performance, and optimization outcomes."
- Primary button: "New Experiment"
- Secondary button: "View Reports"

Metric cards:

1. Total Experiments
2. Average Quality Score
3. Tokens Saved
4. Average Latency
5. Estimated Cost
6. Optimization Success Rate

Each card should include:

- Metric value
- Change compared with the previous period
- Small trend indicator
- Tooltip explaining the metric

Dashboard charts:

1. Response Quality Over Time — line chart comparing baseline and optimized scores.
2. Latency Comparison — bar chart comparing original and optimized latency.
3. Token Usage — area or bar chart showing token consumption over time.
4. Cost Analysis — chart showing estimated cost per experiment.
5. Optimization Distribution — donut chart showing prompt, search, RAG, and SQL tasks.

Recent experiments table:

- Experiment name
- Task type
- Model
- Baseline score
- Optimized score
- Latency
- Status
- Date
- Actions

Include:

- Search
- Filters by task type and status
- Sorting
- Pagination
- Open experiment details
- Duplicate experiment
- Delete experiment with confirmation

Use clearly labeled demo data initially. Never represent demo metrics as real measured production results.

PAGE 2 — PROMPT LAB

Build the main prompt optimization workspace.

Page header:
"Prompt Lab"
Description:
"Analyze, improve, and benchmark prompts before sending them to an LLM."

Layout:

- Desktop: two-column editor and analysis workspace
- Mobile: stacked panels

Top configuration toolbar:

- Task type selector: General, Coding, Research, Summarization, Education, Data Analysis, Writing
- Model selector
- Optimization strategy selector: Balanced, Quality First, Low Cost, Low Latency
- Maximum optimization iterations
- Output length configuration
- Temperature control when supported by the selected provider

Original prompt editor:

- Large editable text area
- Character and estimated token counter
- Clear button
- Paste support
- Example prompt selector
- Input validation
- Optional context field
- Optional constraints field
- Optional expected-output format selector

Primary action:
"Analyze & Optimize"

Secondary actions:

- Reset
- Save Draft
- Load Template

Optimization results panel:

- Optimized prompt editor
- Copy optimized prompt button
- Apply to editor button
- Save as version button
- Restore previous version button

Show an optimization explanation section:

- What changed?
- Why did it change?
- Expected benefit
- Potential trade-offs

Display detected issues:

- Ambiguity
- Missing context
- Missing constraints
- Unspecified output format
- Unnecessary wording

Prompt quality indicators:

- Clarity
- Specificity
- Context completeness
- Instruction following potential
- Constraint coverage

Provide original-versus-optimized comparison with highlighted differences.

Add a version history drawer with timestamps and version labels.

Add an "Execute Comparison" button that runs the original and optimized prompts under comparable model settings.

PAGE 3 — QUERY LAB

Create a dedicated query optimization workspace.

Provide tabs:

1. Search Query
2. RAG Retrieval
3. SQL Query

SEARCH QUERY TAB:

- Original natural-language query editor
- Intent classification
- Query expansion
- Keyword extraction
- Synonym suggestions
- Entity detection
- Optimized query editor
- Original versus optimized query comparison
- Copy and save buttons

RAG RETRIEVAL TAB:

- Question input
- Document collection selector
- Top-K retrieval setting
- Similarity threshold
- Query rewrite toggle
- Hybrid search toggle, disabled when the backend does not support it
- Retrieved documents list
- Relevance scores
- Document snippets
- Source metadata
- Reranking toggle, disabled when unsupported
- Retrieval quality metrics

SQL QUERY TAB:

- SQL code editor with syntax highlighting
- Database dialect selector
- Schema/context input
- Validate Query button
- Optimize Query button
- Original and optimized SQL comparison
- Index recommendations
- Query execution plan panel
- Execution time comparison
- Estimated rows and cost where provided by the database
- Result equivalence status

Never execute arbitrary SQL automatically. Require explicit authorization and backend validation before any execution. Use a safe read-only environment for performance tests.

If the backend does not implement a feature, clearly mark it as unavailable rather than showing fabricated results.

PAGE 4 — EVALUATION STUDIO

Create a detailed evaluation and benchmarking interface.

Page header:
"Evaluation Studio"
Subtitle:
"Measure whether optimization actually improves response quality and performance."

Configuration:

- Select an experiment
- Select baseline run
- Select optimized run
- Select evaluator
- Select reference dataset
- Configure evaluation thresholds

Evaluation metric cards:

- Relevance
- Correctness
- Completeness
- Clarity
- Instruction Following
- Groundedness
- Semantic Preservation

For each metric display:

- Baseline score
- Optimized score
- Absolute change
- Evaluation method
- Explanation
- Evidence or reference where available

Response comparison:

- Original prompt
- Optimized prompt
- Baseline response
- Optimized response
- Highlighted differences
- Evaluation feedback

Performance section:

- Input tokens
- Output tokens
- Total tokens
- End-to-end latency
- Time to first token when supported
- Estimated API cost
- Number of model calls
- Optimization iterations

Charts:

- Baseline versus optimized quality
- Token consumption comparison
- Latency comparison
- Cost comparison
- Quality-versus-cost scatter plot

Add:

- Run Evaluation button
- Export Results button
- Download CSV button
- Save Evaluation Report button

Clearly label metrics produced by an LLM judge versus deterministic tests or human ratings.

Do not treat LLM-generated evaluation scores as verified ground truth.

PAGE 5 — EXPERIMENTS

Build an experiment management page.

Features:

- Create experiment
- Experiment name and description
- Select task type
- Select model and optimizer configuration
- Dataset selection
- Experiment status
- Start, pause when supported, cancel, and retry controls
- Progress indicator for long-running experiments
- Run history
- Experiment details
- Baseline and optimized result comparison
- Duplicate configuration
- Delete experiment with confirmation

Table columns:

- Experiment ID
- Name
- Task type
- Dataset
- Model
- Status
- Number of runs
- Average quality
- Created date
- Actions

Add filters, sorting, pagination, and search.

Do not imply a long-running experiment has completed until the backend confirms its status.

PAGE 6 — HISTORY

Create a searchable history page containing previous prompt and query optimization sessions.

Features:

- Search by prompt text or experiment name
- Filter by task type
- Filter by model
- Filter by date range
- Filter by success/failure
- Open complete result
- Restore a saved prompt
- Re-run an experiment
- Duplicate
- Export
- Delete

Display an informative empty state for new users.

PAGE 7 — ANALYTICS

Build an analytics workspace for performance insights.

KPI cards:

- Total requests
- Successful requests
- Average response quality
- Average latency
- Total input tokens
- Total output tokens
- Estimated total cost
- Average cost per successful request

Charts:

- Quality trend
- Latency trend
- Cost trend
- Token usage trend
- Model comparison
- Task type distribution
- Optimization success rate
- Quality versus latency
- Quality versus cost

Filters:

- Time range
- Model
- Task type
- Dataset
- Optimization strategy

Allow CSV export.

Show clear empty states when insufficient data is available.

PAGE 8 — SETTINGS

Create settings sections:

GENERAL:

- Display name
- Email
- Theme preference
- Default task type
- Default optimization strategy

MODEL CONFIGURATION:

- Provider selector
- Model selector
- API key configuration status
- Default generation parameters
- Connection test

Keep API keys server-side. Do not place secret credentials in local storage or browser-visible configuration. If a provider requires credentials, explain that they must be configured securely through the backend.

OPTIMIZATION SETTINGS:

- Maximum iterations
- Maximum tokens
- Quality threshold
- Semantic preservation threshold
- Latency and cost priorities
- Caching preference

EVALUATION SETTINGS:

- Default evaluator
- Evaluation rubric
- Reference dataset
- Minimum acceptable quality

DATA AND PRIVACY:

- Experiment retention
- Clear history
- Export user data
- Delete account confirmation

Do not implement fake provider connection success. Reflect actual backend status.

PAGE 9 — AUTHENTICATION

Create:

- Login
- Registration
- Forgot password
- Reset password
- Protected application routes
- Logout

Provide form validation and clear errors.

If authentication is not connected to a backend, use a clearly labeled development-only preview mode. Do not treat client-side state as secure authentication.

PAGE 10 — DOCUMENTATION AND HELP

Create a help page with:

- Getting started
- How prompt optimization works
- How query optimization works
- Understanding evaluation metrics
- API documentation
- Troubleshooting
- FAQ

Add a command menu that can navigate to pages and open common actions.

REUSABLE COMPONENTS:

Create reusable components for:

- AppSidebar
- AppHeader
- PageHeader
- MetricCard
- ChartCard
- PromptEditor
- QueryEditor
- ModelSelector
- OptimizationSettings
- ComparisonPanel
- QualityScoreCard
- MetricBreakdown
- ExperimentTable
- ExperimentStatusBadge
- FilterToolbar
- EmptyState
- ErrorState
- LoadingSkeleton
- ConfirmDialog
- ExportMenu
- FeedbackControl
- VersionHistoryDrawer
- Toast notifications

FRONTEND DATA AND STATE:

- Use TypeScript interfaces for all API responses.
- Use TanStack Query for remote data fetching and caching.
- Use React Hook Form and Zod for forms.
- Use React Context or Zustand only where shared client state is needed.
- Keep components small and maintainable.
- Use reusable API service functions.
- Centralize environment configuration.
- Provide an .env.example file.

BACKEND INTEGRATION:

Create an API service layer that can connect to a FastAPI backend.

Use this environment variable:
VITE_API_BASE_URL=http://localhost:8000

Prepare service functions for:

- analyzeInput()
- optimizePrompt()
- optimizeQuery()
- createExperiment()
- runExperiment()
- getExperiment()
- listExperiments()
- getEvaluationMetrics()
- submitFeedback()
- getDashboardSummary()

Use the following planned endpoints:
POST /api/v1/analyze
POST /api/v1/optimize/prompt
POST /api/v1/optimize/query
POST /api/v1/experiments
POST /api/v1/experiments/{id}/run
GET /api/v1/experiments
GET /api/v1/experiments/{id}
GET /api/v1/experiments/{id}/metrics
POST /api/v1/experiments/{id}/feedback
GET /api/v1/dashboard/summary
GET /api/v1/health

Handle network errors, timeouts, loading states and invalid responses gracefully.

DEMO MODE:

The frontend must be usable before the backend is connected.

Create realistic, clearly labeled demo data for dashboards and tables.

Use a development-only demo service adapter that implements the same interface as the real API service. Make switching to the real backend straightforward.

Do not silently fall back to demo data when a real API request fails. Show the error and offer a retry or an explicit switch to demo mode.

Never present simulated quality scores, token savings, latency improvements or cost savings as actual experimental results.

FUNCTIONAL REQUIREMENTS:

- All sidebar links must navigate correctly.
- All tabs must switch content.
- All dialogs must open and close correctly.
- Forms must validate input.
- Copy buttons must copy the correct text.
- Clear and reset buttons must work.
- Filters must actually filter the displayed records.
- Sorting and pagination must work.
- Charts must render with the supplied data.
- Search must work.
- Toasts must confirm completed client-side actions.
- Save and delete actions must update the relevant UI state.
- Use accessible labels and keyboard navigation.
- Avoid dead buttons and placeholder links.
- Do not hardcode fake backend success responses.

RESPONSIVE REQUIREMENTS:

Desktop:

- Persistent collapsible sidebar
- Multi-column dashboard
- Side-by-side editors and comparisons

Tablet:

- Compact sidebar
- Reduced grid columns
- Scrollable comparison panels where needed

Mobile:

- Sidebar drawer
- Single-column layout
- Stacked editors
- Horizontally scrollable wide tables
- Touch-friendly buttons
- Charts sized for small screens

DELIVERABLE:

Generate the complete frontend project with all pages, reusable components, routing, styles, types, mock data, API service abstractions, form validation, responsive layouts and functional client-side interactions.

Start with the shared design system and application shell, then implement all routes and pages. Verify the application builds successfully and fix TypeScript errors, broken imports, missing dependencies and console errors.

The final result should look and behave like a professional, research-oriented AI SaaS platform ready to connect to a real FastAPI backend.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4ff233b4-4ae1-4e03-8c21-bc1a9e09bc6b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

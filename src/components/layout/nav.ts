import {
  BarChart3,
  Beaker,
  Database,
  History,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Sparkles,
} from "lucide-react";

export const NAV = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Integrated Framework", url: "/workflow", icon: Sparkles },
  { title: "Prompt Lab", url: "/prompt-lab", icon: Beaker },
  { title: "Query Lab", url: "/query-lab", icon: Database },
  { title: "History", url: "/history", icon: History },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

export const EXTRA = [{ title: "Help & Docs", url: "/help", icon: LifeBuoy }] as const;
export const ALL_PAGES = [...NAV, ...EXTRA];
export const LabIcon = Beaker;

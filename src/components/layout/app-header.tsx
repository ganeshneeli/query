import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Moon, Search, Settings, Sun, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useApi } from "@/lib/api";
import { useExperiments } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { openCommandMenu } from "./command-menu";
import { ALL_PAGES } from "./nav";

export function AppHeader() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const page = ALL_PAGES.find((p) => path.startsWith(p.url));
  const { resolved, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { mode } = useApi();
  const navigate = useNavigate();
  const { data } = useExperiments();
  const notes = (data ?? [])
    .filter((e) => e.status === "failed" || e.status === "running")
    .slice(0, 5);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger className="md:hidden" aria-label="Open navigation" />
      <div className="min-w-0 flex-1">
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">PromptIQ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{page?.title ?? "Page"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <span className="truncate text-sm font-medium sm:hidden">{page?.title}</span>
      </div>
      <Badge
        variant="outline"
        className={
          mode === "demo"
            ? "hidden border-warning/50 text-warning-foreground dark:text-warning sm:inline-flex"
            : "hidden border-success/50 text-success sm:inline-flex"
        }
      >
        {mode === "demo" ? "Demo mode" : "Live API"}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        className="hidden w-56 justify-start text-muted-foreground md:flex"
        onClick={openCommandMenu}
      >
        <Search className="mr-2 h-4 w-4" />
        Search or jump to…
        <kbd className="ml-auto rounded border bg-muted px-1.5 text-[10px]">⌘K</kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Search"
        onClick={openCommandMenu}
      >
        <Search className="h-4 w-4" />
      </Button>
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                <Bell className="h-4 w-4" />
                {notes.length > 0 && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="border-b px-3 py-2 text-sm font-medium">Notifications</div>
          {notes.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            notes.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate({ to: "/experiments", search: { id: n.id } })}
                className="block w-full border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-muted"
              >
                <span className="font-medium">{n.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {n.id} is {n.status}
                  {n.status === "running" ? ` (${n.progress}%)` : ""}
                </span>
              </button>
            ))
          )}
        </PopoverContent>
      </Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
          >
            {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle theme</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Profile menu">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                {(user?.name ?? "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/help">
              <LifeBuoy className="mr-2 h-4 w-4" />
              Help
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              signOut();
              toast.success("Signed out");
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

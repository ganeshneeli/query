import { Link, useRouterState } from "@tanstack/react-router";
import { LifeBuoy, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { Logo } from "./logo";
import { NAV } from "./nav";

export function AppSidebar() {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { user } = useAuth();
  const initials = (user?.name ?? "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b px-3">
        <Link to="/dashboard" aria-label="PromptIQ home">
          <Logo collapsed={collapsed} />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={path.startsWith(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={path.startsWith("/help")}
              tooltip="Help & documentation"
            >
              <Link to="/help">
                <LifeBuoy />
                <span>Help & documentation</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={user?.name ?? "Profile"} size="lg">
              <Link to="/settings">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 text-left text-xs leading-tight">
                  <span className="truncate font-medium">{user?.name}</span>
                  <span className="truncate text-muted-foreground">{user?.email}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {!isMobile && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggleSidebar}
                tooltip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                <span>Collapse sidebar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

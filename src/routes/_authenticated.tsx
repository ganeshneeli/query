import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { CommandMenu } from "@/components/layout/command-menu";
import { LoadingSkeleton } from "@/components/shared/states";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({ component: Layout });

function Layout() {
  const { user, ready } = useAuth();
  if (!ready)
    return (
      <div className="p-8">
        <LoadingSkeleton />
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </SidebarInset>
      <CommandMenu />
    </SidebarProvider>
  );
}

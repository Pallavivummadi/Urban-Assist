import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Building2, LayoutDashboard, ListChecks, MapPin, CloudSun, Sparkles, BarChart3, Settings, UserCircle2, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/map", label: "Map & Places", icon: MapPin },
  { to: "/weather", label: "Weather", icon: CloudSun },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: UserCircle2 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("ua-theme") as "light" | "dark" | null;
    const t = saved ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border/50 bg-sidebar/80 backdrop-blur-xl transition-transform md:relative md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between px-5">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg gradient-hero text-white"><Building2 className="h-4 w-4" /></div>
            <span className="font-semibold tracking-tight">UrbanAssist</span>
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="px-3 py-2 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-primary text-primary-foreground glow" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-3 bottom-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/50 bg-background/60 px-4 backdrop-blur-xl md:px-8">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
    </div>
  );
}

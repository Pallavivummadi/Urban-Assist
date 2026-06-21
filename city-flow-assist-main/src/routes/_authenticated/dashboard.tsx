import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getWeather } from "@/lib/weather.functions";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2, ListChecks, CloudSun, Wind, Droplets, Sparkles, MapPin, Bell, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — UrbanAssist" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { coords } = useGeolocation();
  const queryClient = useQueryClient();
  const weatherFn = useServerFn(getWeather);

  const weather = useQuery({
    queryKey: ["weather", coords.lat.toFixed(2), coords.lng.toFixed(2)],
    queryFn: () => weatherFn({ data: coords }),
    staleTime: 1000 * 60 * 10,
  });

  const tasks = useQuery({
    queryKey: ["tasks", "today"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("due_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const activities = useQuery({
    queryKey: ["activities", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data;
    },
  });

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").maybeSingle();
      return data;
    },
  });

  const totalTasks = tasks.data?.length ?? 0;
  const completed = tasks.data?.filter((t) => t.completed).length ?? 0;
  const pending = totalTasks - completed;
  const progress = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;

  async function toggleTask(id: string, completed: boolean) {
    await supabase.from("tasks").update({ completed: !completed, completed_at: !completed ? new Date().toISOString() : null }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }

  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; })();
  const name = profile.data?.display_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <div className="glass rounded-2xl p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative">
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">{name} 👋</h1>
          <p className="mt-2 text-muted-foreground">
            Here's your city overview for {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}.
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ListChecks} label="Tasks today" value={totalTasks.toString()} sub={`${pending} pending`} />
        <StatCard icon={CheckCircle2} label="Completed" value={`${progress}%`} sub={`${completed}/${totalTasks} done`} />
        <StatCard
          icon={CloudSun}
          label={weather.data?.city ?? "Weather"}
          value={weather.data ? `${weather.data.temp}°C` : "—"}
          sub={weather.data?.description ?? "Loading…"}
        />
        <StatCard icon={Activity} label="Activity" value={(activities.data?.length ?? 0).toString()} sub="recent events" />
      </div>

      {/* Quick access cards */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Quick access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickCard to="/tasks" icon={ListChecks} title="Plan tasks" desc="Add, edit and complete daily tasks." />
          <QuickCard to="/map" icon={MapPin} title="Nearby services" desc="Hospitals, ATMs, transit & more." />
          <QuickCard to="/weather" icon={CloudSun} title="Weather forecast" desc="7-day outlook for your city." />
          <QuickCard to="/assistant" icon={Sparkles} title="AI assistant" desc="Get personalized suggestions." />
        </div>
      </div>

      {/* Today + weather */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today's tasks</h2>
            <Link to="/tasks" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          {tasks.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : tasks.data && tasks.data.length > 0 ? (
            <ul className="space-y-2">
              {tasks.data.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/40 p-3">
                  <button
                    onClick={() => toggleTask(t.id, t.completed)}
                    className={`grid h-5 w-5 place-items-center rounded-md border ${t.completed ? "bg-primary text-primary-foreground border-primary" : "border-input"}`}
                    aria-label="Toggle complete"
                  >
                    {t.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                    {t.due_at && <p className="text-xs text-muted-foreground">Due {new Date(t.due_at).toLocaleString()}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.priority === "high" ? "bg-destructive/20 text-destructive" : t.priority === "low" ? "bg-muted text-muted-foreground" : "bg-accent/30"}`}>
                    {t.priority}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No tasks yet. Start your day strong.</p>
              <Link to="/tasks"><Button className="mt-3" size="sm">Add your first task</Button></Link>
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Live weather</h2>
          {weather.data ? (
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <img src={`https://openweathermap.org/img/wn/${weather.data.icon}@2x.png`} alt="" className="h-16 w-16 -my-3" />
                <div>
                  <p className="text-4xl font-bold">{weather.data.temp}°</p>
                  <p className="text-sm text-muted-foreground capitalize">{weather.data.description}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2"><Droplets className="h-4 w-4 text-accent" /> {weather.data.humidity}% humidity</div>
                <div className="flex items-center gap-2"><Wind className="h-4 w-4 text-accent" /> {weather.data.wind} km/h</div>
              </div>
              <Link to="/weather" className="mt-4 inline-block text-xs font-medium text-primary hover:underline">See 7-day forecast →</Link>
            </div>
          ) : <p className="mt-4 text-sm text-muted-foreground">{weather.isError ? "Couldn't load weather" : "Loading…"}</p>}
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-accent" />
          <h2 className="text-lg font-semibold">Recent activity</h2>
        </div>
        {activities.data && activities.data.length > 0 ? (
          <ul className="space-y-2">
            {activities.data.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span>{a.label}</span>
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No activity yet — your actions will appear here.</p>}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="grid h-9 w-9 place-items-center rounded-lg gradient-hero text-white"><Icon className="h-4 w-4" /></div>
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function QuickCard({ to, icon: Icon, title, desc }: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link to={to} className="group glass rounded-2xl p-5 transition hover:-translate-y-1 hover:glow">
      <div className="grid h-10 w-10 place-items-center rounded-lg gradient-hero text-white"><Icon className="h-5 w-5" /></div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}

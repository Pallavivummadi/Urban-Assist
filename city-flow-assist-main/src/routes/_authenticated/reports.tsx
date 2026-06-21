import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — UrbanAssist" }] }),
  component: ReportsPage,
});

const COLORS = ["oklch(0.55 0.18 245)", "oklch(0.75 0.15 200)", "oklch(0.65 0.18 280)", "oklch(0.78 0.16 170)", "oklch(0.7 0.2 30)"];

function ReportsPage() {
  const { data: tasks } = useQuery({
    queryKey: ["report-tasks"],
    queryFn: async () => (await supabase.from("tasks").select("*")).data ?? [],
  });
  const { data: activities } = useQuery({
    queryKey: ["report-activities"],
    queryFn: async () => (await supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });

  const total = tasks?.length ?? 0;
  const done = tasks?.filter((t) => t.completed).length ?? 0;
  const pending = total - done;
  const rate = total ? Math.round((done / total) * 100) : 0;

  // Last 7 days completion
  const dayBuckets: Record<string, { date: string; created: number; completed: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayBuckets[key] = { date: d.toLocaleDateString(undefined, { weekday: "short" }), created: 0, completed: 0 };
  }
  for (const t of tasks ?? []) {
    const cd = t.created_at?.slice(0, 10);
    if (cd && dayBuckets[cd]) dayBuckets[cd].created++;
    const dd = t.completed_at?.slice(0, 10);
    if (dd && dayBuckets[dd]) dayBuckets[dd].completed++;
  }
  const daily = Object.values(dayBuckets);

  // Category breakdown
  const catCount: Record<string, number> = {};
  for (const t of tasks ?? []) catCount[t.category] = (catCount[t.category] ?? 0) + 1;
  const catData = Object.entries(catCount).map(([name, value]) => ({ name, value }));

  // Monthly performance
  const monthBuckets: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    monthBuckets[d.toISOString().slice(0, 7)] = 0;
  }
  for (const t of tasks ?? []) {
    if (!t.completed_at) continue;
    const key = t.completed_at.slice(0, 7);
    if (key in monthBuckets) monthBuckets[key]++;
  }
  const monthly = Object.entries(monthBuckets).map(([k, v]) => ({ month: new Date(k + "-01").toLocaleDateString(undefined, { month: "short" }), completed: v }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="mt-1 text-muted-foreground">Insights on your daily and monthly activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total tasks" value={total.toString()} />
        <Stat label="Completed" value={done.toString()} />
        <Stat label="Pending" value={pending.toString()} />
        <Stat label="Completion rate" value={`${rate}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold">Last 7 days</h3>
          <p className="text-xs text-muted-foreground">Tasks created vs. completed</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={daily}>
                <XAxis dataKey="date" stroke="currentColor" fontSize={12} />
                <YAxis stroke="currentColor" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="created" fill="oklch(0.75 0.15 200)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" fill="oklch(0.55 0.18 245)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold">By category</h3>
          <p className="text-xs text-muted-foreground">Distribution across categories</p>
          <div className="mt-4 h-64">
            {catData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full grid place-items-center text-sm text-muted-foreground">No tasks yet.</div>}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold">Monthly performance</h3>
        <p className="text-xs text-muted-foreground">Tasks completed over the last 6 months</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer>
            <BarChart data={monthly}>
              <XAxis dataKey="month" stroke="currentColor" fontSize={12} />
              <YAxis stroke="currentColor" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="completed" fill="oklch(0.55 0.18 245)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold">Activity log</h3>
        {activities && activities.length > 0 ? (
          <ul className="mt-3 max-h-80 overflow-auto divide-y divide-border/50 text-sm">
            {activities.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <span>{a.label}</span>
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-muted-foreground">No activity recorded yet.</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

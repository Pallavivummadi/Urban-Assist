import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Pencil, Plus, Trash2, Bell } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks — UrbanAssist" }] }),
  component: TasksPage,
});

interface TaskForm {
  id?: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high";
  due_at: string;
  reminder_at: string;
}

const empty: TaskForm = { title: "", description: "", category: "general", priority: "medium", due_at: "", reminder_at: "" };

function TasksPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TaskForm>(empty);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = (tasks ?? []).filter((t) =>
    filter === "all" ? true : filter === "pending" ? !t.completed : t.completed
  );

  const completedCount = (tasks ?? []).filter((t) => t.completed).length;
  const total = tasks?.length ?? 0;
  const progress = total ? Math.round((completedCount / total) * 100) : 0;

  async function save() {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      category: form.category,
      priority: form.priority,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      reminder_at: form.reminder_at ? new Date(form.reminder_at).toISOString() : null,
    };
    if (form.id) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", form.id);
      if (error) return toast.error(error.message);
      toast.success("Task updated");
      logActivity("task_updated", `Updated "${form.title}"`);
    } else {
      const { error } = await supabase.from("tasks").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Task added");
      logActivity("task_created", `Created "${form.title}"`);
    }
    setOpen(false);
    setForm(empty);
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  async function toggle(id: string, completed: boolean, title: string) {
    await supabase.from("tasks").update({ completed: !completed, completed_at: !completed ? new Date().toISOString() : null }).eq("id", id);
    if (!completed) logActivity("task_completed", `Completed "${title}"`);
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  async function remove(id: string, title: string) {
    await supabase.from("tasks").delete().eq("id", id);
    toast.success("Task deleted");
    logActivity("task_deleted", `Deleted "${title}"`);
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  function edit(t: NonNullable<typeof tasks>[number]) {
    setForm({
      id: t.id, title: t.title, description: t.description ?? "",
      category: t.category, priority: (t.priority as "low" | "medium" | "high") ?? "medium",
      due_at: t.due_at ? new Date(t.due_at).toISOString().slice(0, 16) : "",
      reminder_at: t.reminder_at ? new Date(t.reminder_at).toISOString().slice(0, 16) : "",
    });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="mt-1 text-muted-foreground">Plan your day, track progress.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild>
            <Button className="glow"><Plus className="mr-2 h-4 w-4" /> New task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? "Edit task" : "New task"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What do you need to do?" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional details" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="errand">Errand</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as "low" | "medium" | "high" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Due</Label><Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} /></div>
                <div><Label>Reminder</Label><Input type="datetime-local" value={form.reminder_at} onChange={(e) => setForm({ ...form, reminder_at: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={save}>{form.id ? "Save changes" : "Create task"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Daily progress</p>
            <p className="mt-1 text-2xl font-bold">{progress}%</p>
          </div>
          <p className="text-sm text-muted-foreground">{completedCount}/{total} completed</p>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full gradient-hero transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">No tasks here yet.</div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => (
            <li key={t.id} className="glass rounded-xl p-4 flex items-start gap-3">
              <button
                onClick={() => toggle(t.id, t.completed, t.title)}
                className={`mt-0.5 grid h-5 w-5 place-items-center rounded-md border shrink-0 ${t.completed ? "bg-primary text-primary-foreground border-primary" : "border-input"}`}
                aria-label="Toggle"
              >
                {t.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`font-medium ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/30">{t.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.priority === "high" ? "bg-destructive/20 text-destructive" : t.priority === "low" ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary"}`}>{t.priority}</span>
                </div>
                {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  {t.due_at && <span>Due {new Date(t.due_at).toLocaleString()}</span>}
                  {t.reminder_at && <span className="flex items-center gap-1"><Bell className="h-3 w-3" /> {new Date(t.reminder_at).toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => edit(t)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(t.id, t.title)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

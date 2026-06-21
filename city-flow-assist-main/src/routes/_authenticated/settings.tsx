import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Moon, Sun, Bell, Lock, Globe } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — UrbanAssist" }] }),
  component: SettingsPage,
});

interface Prefs { darkMode: boolean; notifications: boolean; language: string }

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("*").maybeSingle()).data,
  });

  const [prefs, setPrefs] = useState<Prefs>({ darkMode: false, notifications: true, language: "en" });

  useEffect(() => {
    if (profile?.preferences) setPrefs(profile.preferences as unknown as Prefs);
    else setPrefs({ darkMode: document.documentElement.classList.contains("dark"), notifications: true, language: "en" });
  }, [profile]);

  function apply(p: Prefs) {
    document.documentElement.classList.toggle("dark", p.darkMode);
    localStorage.setItem("ua-theme", p.darkMode ? "dark" : "light");
  }

  async function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    apply(next);
    if (!user) return;
    await supabase.from("profiles").upsert({ id: user.id, preferences: next as unknown as never });
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function resetPassword() {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin + "/auth" });
    if (error) toast.error(error.message); else toast.success("Password reset email sent");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Customize how UrbanAssist looks and behaves.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <Row icon={prefs.darkMode ? Moon : Sun} title="Dark mode" desc="Switch between light and dark themes.">
          <Switch checked={prefs.darkMode} onCheckedChange={(v) => update({ darkMode: v })} />
        </Row>
        <Row icon={Bell} title="Notifications" desc="Smart alerts for tasks, weather and traffic.">
          <Switch checked={prefs.notifications} onCheckedChange={(v) => update({ notifications: v })} />
        </Row>
        <Row icon={Globe} title="Language" desc="Display language for the app.">
          <Select value={prefs.language} onValueChange={(v) => update({ language: v })}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>
        </Row>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Lock className="h-4 w-4" /> Privacy & security</h2>
        <p className="text-sm text-muted-foreground">Your data is encrypted and visible only to you. Tasks, activities and profile data are scoped per-user via row-level security.</p>
        <Button variant="outline" onClick={resetPassword}>Send password reset email</Button>
      </div>
    </div>
  );
}

function Row({ icon: Icon, title, desc, children }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex gap-3 min-w-0">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent/30 shrink-0"><Icon className="h-4 w-4" /></div>
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

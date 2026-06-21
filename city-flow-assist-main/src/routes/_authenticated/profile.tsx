import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — UrbanAssist" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("*").maybeSingle()).data,
  });

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setCity(profile.city ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: name, city, phone });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="mt-1 text-muted-foreground">Personal information used across UrbanAssist.</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full gradient-hero text-white"><UserCircle2 className="h-8 w-8" /></div>
          <div>
            <p className="font-semibold">{name || user?.email}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div><Label>Display name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
          <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bengaluru" /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" /></div>
          <div><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button></div>
        </div>
      </div>
    </div>
  );
}

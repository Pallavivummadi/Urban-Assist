import { supabase } from "@/integrations/supabase/client";

export async function logActivity(kind: string, label: string, meta?: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("activities").insert({ user_id: user.id, kind, label, meta: (meta ?? null) as never });
}

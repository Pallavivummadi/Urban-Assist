import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — UrbanAssist" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name }, emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;

        if (data.session) {
          toast.success("Account created — welcome!");
          navigate({ to: "/dashboard" });
        } else {
          toast.success("Account created! Please check your email to confirm your account before logging in.");
          setMode("signin");
          setEmail("");
          setPassword("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  }

  async function handleForgot() {
    if (!email) { toast.info("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth",
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between gradient-hero p-12 text-white">
        <Link to="/" className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <span className="text-lg font-semibold">UrbanAssist</span>
        </Link>
        <div>
          <h2 className="text-4xl font-bold leading-tight">Your smart city, in one app.</h2>
          <p className="mt-4 max-w-md text-white/80">
            Tasks, weather, maps, nearby services and an AI assistant — built to make daily city life effortless.
          </p>
        </div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} UrbanAssist</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md glass-strong rounded-2xl p-8">
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-hero text-white"><Building2 className="h-5 w-5" /></div>
            <span className="text-lg font-semibold">UrbanAssist</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in or create your account.</p>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <TabsContent value="signup" className="space-y-4 mt-0">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required={mode === "signup"} />
                </div>
              </TabsContent>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@city.com" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? "Create account" : "Sign in"}
              </Button>
              {mode === "signin" && (
                <button type="button" onClick={handleForgot} className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                  Forgot password?
                </button>
              )}
            </form>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" onClick={handleGoogle} disabled={loading} className="w-full">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.45.36-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}

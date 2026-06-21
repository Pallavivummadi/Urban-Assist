import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, MapPin, CloudSun, ListChecks, Sparkles, BarChart3, Bell, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UrbanAssist — Your Smart City Companion" },
      { name: "description", content: "All-in-one dashboard for tasks, weather, maps, nearby services and AI assistance — built for modern city life." },
      { property: "og:title", content: "UrbanAssist — Smart City Life Assistant" },
      { property: "og:description", content: "Tasks, weather, maps, and AI in one beautiful dashboard." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-hero text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">UrbanAssist</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link to="/auth" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground glow hover:opacity-90">
            Get started
          </Link>
        </nav>
      </header>

      <section className="container mx-auto px-6 pt-12 pb-24 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Smart city management, reimagined
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-7xl">
            Your city.<br />
            <span className="text-gradient">One smart dashboard.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            UrbanAssist brings tasks, weather, navigation, nearby services and an AI assistant
            together — so daily life in the city feels effortless.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow hover:opacity-90">
              Launch your dashboard
            </Link>
            <a href="#features" className="rounded-xl glass px-6 py-3 text-sm font-semibold hover:bg-accent/30">
              Explore features
            </a>
          </div>
        </div>

        <div id="features" className="mt-24 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ListChecks, title: "Smart Tasks", desc: "Plan your day with reminders, priorities and progress tracking." },
            { icon: CloudSun, title: "Live Weather", desc: "Real-time conditions and a 7-day forecast for your city." },
            { icon: MapPin, title: "Nearby Services", desc: "Hospitals, ATMs, restaurants, transit & emergency — instantly." },
            { icon: Sparkles, title: "AI Assistant", desc: "Personalized suggestions powered by an on-device-style AI." },
            { icon: Bell, title: "Smart Alerts", desc: "Weather, traffic and reminders surfaced at the right moment." },
            { icon: BarChart3, title: "Reports", desc: "Daily, weekly and monthly insights into your activity." },
            { icon: ShieldCheck, title: "Private & Secure", desc: "Your data is encrypted and only visible to you." },
            { icon: Building2, title: "Built for cities", desc: "Designed around the rhythm of modern urban life." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 transition hover:-translate-y-1 hover:glow">
              <div className="grid h-10 w-10 place-items-center rounded-xl gradient-hero text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} UrbanAssist — Smart Daily City Life Management System
      </footer>
    </div>
  );
}

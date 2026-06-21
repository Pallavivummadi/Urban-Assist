import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askAssistant } from "@/lib/assistant.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Loader2, Mic } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — UrbanAssist" }] }),
  component: AssistantPage,
});

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Plan my day around the weather",
  "Suggest 3 productivity tips for today",
  "Recommend a healthy lunch nearby",
  "Help me prioritize my tasks",
];

function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your UrbanAssist AI. I can help plan your day, suggest activities, and give weather-aware advice. What's on your mind?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const ask = useServerFn(askAssistant);

  async function send(text: string) {
    if (!text.trim()) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await ask({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't get response");
    } finally { setLoading(false); }
  }

  function toggleVoice() {
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) { toast.info("Voice not supported on this browser"); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    r.lang = "en-US"; r.interimResults = false;
    r.onresult = (e: any) => setInput(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recognitionRef.current = r;
    r.start();
    setListening(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl gradient-hero text-white glow"><Sparkles className="h-6 w-6" /></div>
        <div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground">Personalized suggestions for your day.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 md:p-6 flex flex-col" style={{ minHeight: "60vh" }}>
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border/50"
              }`}>{m.content}</div>
            </div>
          ))}
          {loading && <div className="flex"><div className="rounded-2xl bg-card border border-border/50 px-4 py-3 text-sm"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
        </div>

        {messages.length <= 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="text-xs glass rounded-full px-3 py-1.5 hover:bg-accent/30">{s}</button>
            ))}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-4 flex gap-2">
          <Button type="button" variant="outline" size="icon" onClick={toggleVoice} className={listening ? "bg-destructive/20" : ""}>
            <Mic className="h-4 w-4" />
          </Button>
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything…" disabled={loading} />
          <Button type="submit" disabled={loading || !input.trim()}><Send className="h-4 w-4" /></Button>
        </form>
      </div>
    </div>
  );
}

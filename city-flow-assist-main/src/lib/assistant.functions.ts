import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Message = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const Input = z.object({
  messages: z.array(Message).min(1),
  context: z.object({
    city: z.string().optional(),
    weather: z.string().optional(),
    tasksToday: z.number().optional(),
  }).optional(),
});

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI service not configured");

    const sys = `You are UrbanAssist, an upbeat smart-city life assistant. Help the user plan their day, give weather-aware suggestions, recommend nearby activities, and produce short actionable advice. Keep responses concise and friendly. ${
      data.context ? `Context: ${JSON.stringify(data.context)}` : ""
    }`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, ...data.messages],
      }),
    });

    if (res.status === 429) throw new Error("AI is busy — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Lovable.");
    if (!res.ok) throw new Error(`AI error: ${res.status}`);
    const json = await res.json();
    return { reply: json.choices?.[0]?.message?.content ?? "" };
  });

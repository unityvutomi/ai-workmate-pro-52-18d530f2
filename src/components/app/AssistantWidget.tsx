import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/app/Markdown";
import { assistantChat } from "@/lib/ai.functions";
import { useStore, workspaceContext } from "@/lib/store";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What should I focus on today?",
  "Help me plan my week.",
  "Turn my latest meeting notes into tasks.",
  "How can I clear my overdue work?",
];

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const store = useStore();
  const chat = useServerFn(assistantChat);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const res = await chat({
        data: {
          messages: next.slice(-10),
          context: workspaceContext({
            tasks: store.tasks,
            emails: store.emails,
            meetings: store.meetings,
          }),
        },
      });
      setMessages([...next, { role: "assistant", content: res.content }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The assistant is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI assistant"
        className="gradient-primary fixed right-5 bottom-5 z-50 size-14 rounded-full text-primary-foreground shadow-[var(--shadow-lift)] transition-transform hover:scale-105"
      >
        {open ? <X className="size-6" /> : <Sparkles className="size-6" />}
      </Button>

      <div
        className={cn(
          "surface-card fixed right-4 bottom-24 z-50 flex max-h-[70vh] w-[calc(100vw-2rem)] flex-col overflow-hidden transition-all duration-300 sm:w-[24rem]",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0",
        )}
        role="dialog"
        aria-label="AI assistant"
        aria-hidden={!open}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Bot className="size-4 text-primary" />
          <p className="text-sm font-semibold">AI Assistant</p>
          <span className="ml-auto text-xs text-muted-foreground">Always on</span>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ask anything about your work — I can see your tasks, meetings and drafts.
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "animate-rise max-w-[92%] rounded-xl px-3 py-2 text-sm",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {m.role === "assistant" ? <Markdown>{m.content}</Markdown> : m.content}
            </div>
          ))}

          {loading ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Thinking…
            </p>
          ) : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <div ref={endRef} />
        </div>

        <form
          className="flex gap-2 border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your assistant…"
            aria-label="Message the AI assistant"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
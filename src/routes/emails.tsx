import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Loader2, Mail, RefreshCw, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { Markdown } from "@/components/app/Markdown";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { composeEmail } from "@/lib/ai.functions";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/emails")({
  head: () => ({
    meta: [
      { title: "Smart Emails Generator — Workplace AI" },
      {
        name: "description",
        content:
          "Draft, rewrite, shorten and proofread professional emails in seconds with AI tone control and subject line suggestions.",
      },
      { property: "og:title", content: "Smart Emails Generator — Workplace AI" },
      {
        property: "og:description",
        content: "Generate polished workplace emails, rewrite tone and fix grammar instantly.",
      },
    ],
  }),
  component: EmailsPage,
});

const MODES = [
  { value: "generate", label: "Generate" },
  { value: "rewrite", label: "Rewrite" },
  { value: "subject", label: "Subject lines" },
  { value: "grammar", label: "Fix grammar" },
  { value: "summarize", label: "Summarize thread" },
] as const;

type Mode = (typeof MODES)[number]["value"];

const PLACEHOLDERS: Record<Mode, string> = {
  generate: "Write an email to my manager requesting two days off next week.",
  rewrite: "Paste the email you want rewritten…",
  subject: "Describe the email you need subject lines for…",
  grammar: "Paste text to proofread…",
  summarize: "Paste the full email conversation…",
};

function EmailsPage() {
  const [mode, setMode] = useState<Mode>("generate");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const run = useServerFn(composeEmail);
  const { addEmail } = useStore();

  async function generate() {
    if (!input.trim()) {
      toast.error("Add some instructions first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await run({ data: { instruction: input, mode, tone, length } });
      setResult(res.content);
      setEditing(false);
      addEmail({ prompt: input.slice(0, 160), mode, tone, content: res.content });
      toast.success("Draft ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong generating your email.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <PageHeader
        icon={<Mail className="size-5" />}
        title="Smart Emails"
        description="Turn a one-line instruction into a polished, ready-to-send email — then adjust the tone, fix grammar or summarize a long thread."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card space-y-4 p-5">
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-secondary sm:grid-cols-3">
              {MODES.map((m) => (
                <TabsTrigger key={m.value} value={m.value} className="text-xs whitespace-nowrap">
                  {m.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="email-input">Your instruction</Label>
            <Textarea
              id="email-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={PLACEHOLDERS[mode]}
              className="min-h-44 resize-y"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["professional", "friendly", "concise", "persuasive", "formal", "apologetic"].map(
                    (t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["short", "medium", "detailed"].map((l) => (
                    <SelectItem key={l} value={l} className="capitalize">
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={() => void generate()} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Writing…
              </>
            ) : (
              <>
                <Wand2 className="size-4" /> Generate
              </>
            )}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </section>

        <section className="space-y-4">
          {loading && !result ? (
            <div className="surface-card space-y-3 p-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-4 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : result ? (
            <div className="surface-card animate-rise space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">Result</h2>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void copy()}>
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing((e) => !e)}>
                    {editing ? "Preview" : "Edit"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void generate()}>
                    <RefreshCw className="size-4" /> Regenerate
                  </Button>
                </div>
              </div>
              {editing ? (
                <Textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="min-h-80"
                />
              ) : (
                <Markdown>{result}</Markdown>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Mail className="size-5" />}
              title="No draft yet"
              description="Describe the email you need and your polished draft will appear here."
            />
          )}
        </section>
      </div>
    </>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, CheckSquare, Loader2, Upload, Wand2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { summarizeMeeting, type MeetingAnalysis } from "@/lib/ai.functions";
import { useStore, type Priority } from "@/lib/store";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Workplace AI" },
      {
        name: "description",
        content:
          "Paste or upload a transcript and get an executive summary, key points, decisions, owners and action items in seconds.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer — Workplace AI" },
      {
        property: "og:description",
        content: "Turn messy meeting notes into summaries, decisions and assigned action items.",
      },
    ],
  }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<MeetingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const run = useServerFn(summarizeMeeting);
  const { addMeeting, addTasks } = useStore();

  async function analyse() {
    if (transcript.trim().length < 10) {
      toast.error("Paste at least a few lines of notes.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await run({ data: { transcript } });
      setResult(res);
      addMeeting(res);
      toast.success("Meeting analysed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not summarize this meeting.");
    } finally {
      setLoading(false);
    }
  }

  function importActionItems() {
    if (!result?.actionItems.length) return;
    addTasks(
      result.actionItems.map((a) => ({
        title: a.task,
        notes: a.owner && a.owner !== "Unassigned" ? `Owner: ${a.owner}` : "",
        project: result.title || "Meeting follow-ups",
        priority: (["high", "medium", "low"].includes(a.priority)
          ? a.priority
          : "medium") as Priority,
        due: /^\d{4}-\d{2}-\d{2}$/.test(a.due) ? a.due : "",
      })),
    );
    toast.success(`${result.actionItems.length} tasks added to My Tasks`);
  }

  return (
    <>
      <PageHeader
        icon={<CalendarCheck className="size-5" />}
        title="Meeting Summarizer"
        description="Drop in a transcript or rough notes and get a structured recap: summary, key points, decisions, action items and follow-ups."
      />

      <section className="surface-card space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="transcript">Transcript or notes</Label>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" /> Upload .txt / .md
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.csv,text/plain"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setTranscript(await file.text());
              toast.success(`Loaded ${file.name}`);
            }}
          />
        </div>
        <Textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="[10:02] Priya: We agreed to ship the beta on the 14th…"
          className="min-h-56 resize-y"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void analyse()} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Analysing…
              </>
            ) : (
              <>
                <Wand2 className="size-4" /> Summarize meeting
              </>
            )}
          </Button>
          {transcript ? (
            <Button variant="ghost" onClick={() => setTranscript("")}>
              Clear
            </Button>
          ) : null}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </section>

      {loading && !result ? (
        <div className="surface-card space-y-3 p-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : result ? (
        <div className="animate-rise space-y-5">
          <section className="surface-card space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{result.title}</h2>
              {result.actionItems.length ? (
                <Button size="sm" className="ml-auto" onClick={importActionItems}>
                  <CheckSquare className="size-4" /> Add action items to tasks
                </Button>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">{result.executiveSummary}</p>
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <ListCard title="Key points" items={result.keyPoints} />
            <ListCard title="Decisions" items={result.decisions} />
          </div>

          <section className="surface-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Action items</h3>
            {result.actionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No action items detected.</p>
            ) : (
              <ul className="space-y-2">
                {result.actionItems.map((a, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm"
                  >
                    <span className="font-medium">{a.task}</span>
                    <Badge variant="secondary">{a.owner}</Badge>
                    <Badge variant="outline">{a.due}</Badge>
                    <Badge className="ml-auto capitalize">{a.priority}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <ListCard title="Follow-ups" items={result.followUps} />
        </div>
      ) : (
        <EmptyState
          icon={<CalendarCheck className="size-5" />}
          title="No meeting analysed yet"
          description="Paste notes from your last stand-up, client call or workshop to get a structured recap."
        />
      )}
    </>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="surface-card p-5">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing captured here.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
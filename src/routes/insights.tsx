import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/app/PageHeader";
import { Markdown } from "@/components/app/Markdown";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { assistantChat } from "@/lib/ai.functions";
import { productivityScore, todayISO, useStore, workspaceContext } from "@/lib/store";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Productivity Insights — Workplace AI" },
      {
        name: "description",
        content:
          "See your productivity score, workload by priority, completion trends and AI coaching on how to work better this week.",
      },
      { property: "og:title", content: "Productivity Insights — Workplace AI" },
      {
        property: "og:description",
        content: "Track completion trends and get AI coaching on your workload.",
      },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const store = useStore();
  const { tasks, emails, meetings } = store;
  const score = productivityScore(tasks);
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chat = useServerFn(assistantChat);

  const byPriority = useMemo(
    () =>
      (["high", "medium", "low"] as const).map((p) => ({
        name: p,
        value: tasks.filter((t) => t.priority === p && t.status !== "done").length,
      })),
    [tasks],
  );

  const activity = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    return days.map((day) => ({
      day: day.slice(5),
      completed: tasks.filter((t) => t.status === "done" && t.createdAt.slice(0, 10) === day).length,
      created: tasks.filter((t) => t.createdAt.slice(0, 10) === day).length,
    }));
  }, [tasks]);

  const overdue = tasks.filter((t) => t.status !== "done" && t.due && t.due < todayISO()).length;
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)"];

  async function coach() {
    setLoading(true);
    setError("");
    try {
      const res = await chat({
        data: {
          messages: [
            {
              role: "user",
              content:
                "Review my current workload and give me 3 specific productivity recommendations for this week, plus one thing to drop or delegate.",
            },
          ],
          context: workspaceContext({ tasks, emails, meetings }),
        },
      });
      setAdvice(res.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate insights.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        icon={<BarChart3 className="size-5" />}
        title="Productivity Insights"
        description="How your workload is trending and where the assistant thinks you should focus next."
        actions={
          <Button onClick={() => void coach()} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Analysing…
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Get AI coaching
              </>
            )}
          </Button>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Productivity score" value={`${score}`} sub="Based on completion & overdue" />
        <Stat label="Open tasks" value={`${tasks.filter((t) => t.status !== "done").length}`} sub="Across all projects" />
        <Stat label="Overdue" value={`${overdue}`} sub="Needs attention today" />
        <Stat label="AI outputs" value={`${emails.length + meetings.length}`} sub="Emails & summaries" />
      </div>

      <section className="surface-card space-y-3 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Weekly momentum</span>
          <span className="text-muted-foreground">{score}%</span>
        </div>
        <Progress value={score} />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Task activity (last 7 days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="created" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Open work by priority</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byPriority} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {byPriority.map((_, i) => (
                    <Cell key={i} fill={colors[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            {byPriority.map((p, i) => (
              <span key={p.name} className="flex items-center gap-1.5 capitalize">
                <span className="size-2 rounded-full" style={{ background: colors[i] }} />
                {p.name} ({p.value})
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="surface-card p-5">
        <h3 className="mb-3 text-sm font-semibold">AI recommendations</h3>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {advice ? (
          <Markdown>{advice}</Markdown>
        ) : (
          <p className="text-sm text-muted-foreground">
            Run AI coaching to get tailored recommendations based on your current workload.
          </p>
        )}
      </section>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="surface-card animate-rise p-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
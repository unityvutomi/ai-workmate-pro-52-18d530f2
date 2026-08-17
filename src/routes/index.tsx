import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CalendarCheck,
  Clock,
  Lightbulb,
  Loader2,
  Mail,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/app/PageHeader";
import { TaskRow } from "@/components/app/TaskRow";
import { Markdown } from "@/components/app/Markdown";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { assistantChat } from "@/lib/ai.functions";
import { productivityScore, todayISO, useStore, workspaceContext } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "One AI workspace for professional emails, meeting summaries and smart task planning — with a live productivity dashboard.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content:
          "Draft emails, summarize meetings and plan your week with an AI assistant built for professionals.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const store = useStore();
  const { tasks, emails, meetings, ready } = store;
  const score = productivityScore(tasks);
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chat = useServerFn(assistantChat);

  const today = todayISO();
  const { todayTasks, upcoming, overdue } = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "done");
    return {
      todayTasks: open.filter((t) => t.due && t.due <= today).slice(0, 5),
      upcoming: open
        .filter((t) => t.due && t.due > today)
        .sort((a, b) => a.due.localeCompare(b.due))
        .slice(0, 5),
      overdue: open.filter((t) => t.due && t.due < today).length,
    };
  }, [tasks, today]);

  async function getInsight() {
    setLoading(true);
    setError("");
    try {
      const res = await chat({
        data: {
          messages: [
            {
              role: "user",
              content: "In 3 short bullets, what should I focus on today and why?",
            },
          ],
          context: workspaceContext({ tasks, emails, meetings }),
        },
      });
      setInsight(res.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the assistant.");
    } finally {
      setLoading(false);
    }
  }

  const [greeting, setGreeting] = useState("Welcome back");
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <>
      <PageHeader
        icon={<Sparkles className="size-5" />}
        title={`${greeting}, Alex`}
        description="Here's your workspace at a glance — priorities, deadlines and everything your assistant produced recently."
        actions={
          <>
            <Button asChild>
              <Link to="/emails">
                <Mail className="size-4" /> Generate email
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/meetings">
                <CalendarCheck className="size-4" /> Summarize meeting
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/planner">
                <Sparkles className="size-4" /> Plan tasks
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card animate-rise space-y-3 p-5">
          <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <TrendingUp className="size-3.5" /> Productivity score
          </p>
          <p className="text-3xl font-semibold text-gradient">{score}</p>
          <Progress value={score} />
        </div>
        <Metric
          icon={<Clock className="size-3.5" />}
          label="Due today"
          value={todayTasks.length}
          sub="Tasks needing action"
        />
        <Metric
          icon={<AlertTriangle className="size-3.5" />}
          label="Overdue"
          value={overdue}
          sub="Past their deadline"
        />
        <Metric
          icon={<Sparkles className="size-3.5" />}
          label="AI outputs"
          value={emails.length + meetings.length}
          sub="Drafts & summaries"
        />
      </div>

      <section className="surface-card space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="size-4 text-primary" /> AI productivity insight
          </h2>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => void getInsight()} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {insight ? "Refresh" : "What should I focus on?"}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {insight ? (
          <Markdown>{insight}</Markdown>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ask the assistant to review your open work and suggest today's focus.
          </p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Today's tasks</h2>
          {!ready ? null : todayTasks.length === 0 ? (
            <p className="surface-card p-5 text-sm text-muted-foreground">
              Nothing due today.{" "}
              <Link to="/planner" className="text-primary underline">
                Plan something new
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {todayTasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Upcoming deadlines</h2>
          {!ready ? null : upcoming.length === 0 ? (
            <p className="surface-card p-5 text-sm text-muted-foreground">
              No upcoming deadlines scheduled.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <RecentList
          title="Recent emails"
          to="/emails"
          empty="No drafts yet — generate your first email."
          items={emails.slice(0, 4).map((e) => ({ id: e.id, primary: e.prompt, secondary: e.tone }))}
        />
        <RecentList
          title="Recent meeting summaries"
          to="/meetings"
          empty="No summaries yet — paste a transcript to start."
          items={meetings
            .slice(0, 4)
            .map((m) => ({ id: m.id, primary: m.title, secondary: `${m.actionItems.length} actions` }))}
        />
      </div>
    </>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="surface-card animate-rise p-5">
      <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {icon} {label}
      </p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function RecentList({
  title,
  to,
  items,
  empty,
}: {
  title: string;
  to: "/emails" | "/meetings";
  items: { id: string; primary: string; secondary: string }[];
  empty: string;
}) {
  return (
    <section className="surface-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link to={to} className="ml-auto text-xs text-primary underline">
          Open
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-2 rounded-lg border border-border p-3">
              <span className="min-w-0 flex-1 truncate">{i.primary}</span>
              <span className="text-xs text-muted-foreground capitalize">{i.secondary}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

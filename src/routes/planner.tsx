import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lightbulb, Loader2, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { planTasks, type TaskPlan } from "@/lib/ai.functions";
import { todayISO, useStore } from "@/lib/store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Workplace AI" },
      {
        name: "description",
        content:
          "Describe a goal in plain language and get a prioritised task breakdown with suggested deadlines and effort estimates.",
      },
      { property: "og:title", content: "AI Task Planner — Workplace AI" },
      {
        property: "og:description",
        content: "Break big projects into prioritised, scheduled tasks automatically.",
      },
    ],
  }),
  component: PlannerPage,
});

const EXAMPLES = [
  "Launch our Q3 customer newsletter",
  "Prepare the quarterly board deck by Friday",
  "Onboard a new designer onto the design system team",
];

function PlannerPage() {
  const [goal, setGoal] = useState("");
  const [plan, setPlan] = useState<TaskPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const run = useServerFn(planTasks);
  const { addTasks } = useStore();

  async function generate() {
    if (goal.trim().length < 3) {
      toast.error("Describe what you want to get done.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await run({ data: { goal, today: todayISO() } });
      setPlan(res);
      toast.success("Plan ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build a plan right now.");
    } finally {
      setLoading(false);
    }
  }

  function saveAll() {
    if (!plan?.tasks.length) return;
    addTasks(
      plan.tasks.map((t) => ({
        title: t.title,
        notes: t.notes,
        project: plan.project,
        priority: t.priority,
        due: /^\d{4}-\d{2}-\d{2}$/.test(t.due) ? t.due : "",
        estimate: t.estimate,
      })),
    );
    toast.success("Tasks added to My Tasks");
  }

  return (
    <>
      <PageHeader
        icon={<Sparkles className="size-5" />}
        title="AI Task Planner"
        description="Type a goal in natural language. The planner splits it into ordered tasks with priorities, estimates and suggested deadlines."
      />

      <section className="surface-card space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="goal">What do you want to get done?</Label>
          <Textarea
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Plan and run our product launch webinar next month"
            className="min-h-28"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              onClick={() => setGoal(e)}
              className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {e}
            </button>
          ))}
        </div>
        <Button onClick={() => void generate()} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Planning…
            </>
          ) : (
            <>
              <Sparkles className="size-4" /> Build my plan
            </>
          )}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </section>

      {loading && !plan ? (
        <div className="surface-card space-y-3 p-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : plan && plan.tasks.length ? (
        <section className="surface-card animate-rise space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{plan.project}</h2>
            <Button size="sm" className="ml-auto" onClick={saveAll}>
              <Plus className="size-4" /> Add all to My Tasks
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/tasks">Open My Tasks</Link>
            </Button>
          </div>

          {plan.insight ? (
            <p className="flex gap-2 rounded-lg bg-accent p-3 text-sm text-accent-foreground">
              <Lightbulb className="mt-0.5 size-4 shrink-0" />
              {plan.insight}
            </p>
          ) : null}

          <ol className="space-y-2">
            {plan.tasks.map((t, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="font-medium">{t.title}</span>
                <Badge variant="secondary">{t.estimate}</Badge>
                <Badge variant="outline">{t.due}</Badge>
                <Badge className="ml-auto capitalize">{t.priority}</Badge>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <EmptyState
          icon={<Sparkles className="size-5" />}
          title="No plan yet"
          description="Describe a project or goal above and the planner will break it down for you."
        />
      )}
    </>
  );
}
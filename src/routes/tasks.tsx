import { createFileRoute } from "@tanstack/react-router";
import { ListTodo, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { TaskRow } from "@/components/app/TaskRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { todayISO, useStore, type Priority, type Task } from "@/lib/store";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "My Tasks — Workplace AI" },
      {
        name: "description",
        content:
          "Track everything in one place: today's work, upcoming deadlines, tasks in progress and what you've completed.",
      },
      { property: "og:title", content: "My Tasks — Workplace AI" },
      {
        property: "og:description",
        content: "A focused task board for today, upcoming, in progress and completed work.",
      },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { tasks, addTasks, ready } = useStore();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [due, setDue] = useState("");

  const groups = useMemo(() => {
    const today = todayISO();
    const open = tasks.filter((t) => t.status !== "done");
    return {
      today: open.filter((t) => t.due && t.due <= today),
      upcoming: open.filter((t) => !t.due || t.due > today),
      progress: tasks.filter((t) => t.status === "in-progress"),
      done: tasks.filter((t) => t.status === "done"),
    };
  }, [tasks]);

  function add() {
    if (!title.trim()) return;
    addTasks([{ title: title.trim(), project: "Personal", priority, due, notes: "" }]);
    setTitle("");
    setDue("");
    toast.success("Task added");
  }

  return (
    <>
      <PageHeader
        icon={<ListTodo className="size-5" />}
        title="My Tasks"
        description="Everything the assistant created, plus anything you add yourself — organised by when it needs your attention."
      />

      <section className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task…"
          aria-label="Task title"
          className="flex-1"
        />
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
          <SelectTrigger className="sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["high", "medium", "low"] as Priority[]).map((p) => (
              <SelectItem key={p} value={p} className="capitalize">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Due date"
          className="sm:w-44"
        />
        <Button onClick={add}>
          <Plus className="size-4" /> Add
        </Button>
      </section>

      {!ready ? null : tasks.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="size-5" />}
          title="No tasks yet"
          description="Add one above, or let the AI Task Planner break a project down for you."
        />
      ) : (
        <Tabs defaultValue="today">
          <TabsList className="flex w-full flex-wrap justify-start bg-secondary">
            <TabsTrigger value="today">Today ({groups.today.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({groups.upcoming.length})</TabsTrigger>
            <TabsTrigger value="progress">In progress ({groups.progress.length})</TabsTrigger>
            <TabsTrigger value="done">Completed ({groups.done.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="today">
            <TaskGroup tasks={groups.today} empty="Nothing due today. Enjoy the focus time." />
          </TabsContent>
          <TabsContent value="upcoming">
            <TaskGroup tasks={groups.upcoming} empty="No upcoming work scheduled." />
          </TabsContent>
          <TabsContent value="progress">
            <TaskGroup tasks={groups.progress} empty="Nothing in progress yet." />
          </TabsContent>
          <TabsContent value="done">
            <TaskGroup tasks={groups.done} empty="Completed tasks will appear here." />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}

function TaskGroup({ tasks, empty }: { tasks: Task[]; empty: string }) {
  if (tasks.length === 0) {
    return <p className="px-1 py-6 text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="mt-4 space-y-2">
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} />
      ))}
    </ul>
  );
}
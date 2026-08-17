import { Check, Play, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { todayISO, useStore, type Task } from "@/lib/store";

const priorityStyles: Record<string, string> = {
  high: "bg-destructive/12 text-destructive border-destructive/30",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-success/15 text-success border-success/30",
};

export function TaskRow({ task }: { task: Task }) {
  const { updateTask, removeTask } = useStore();
  const overdue = task.status !== "done" && task.due && task.due < todayISO();

  return (
    <li className="surface-card animate-rise flex flex-wrap items-center gap-3 p-3.5 transition-shadow hover:shadow-[var(--shadow-lift)]">
      <Checkbox
        checked={task.status === "done"}
        aria-label={`Mark ${task.title} complete`}
        onCheckedChange={(v) => updateTask(task.id, { status: v ? "done" : "todo" })}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium",
            task.status === "done" && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {task.project}
          {task.estimate ? ` · ${task.estimate}` : ""}
          {task.notes ? ` · ${task.notes}` : ""}
        </p>
      </div>
      <Badge variant="outline" className={cn("capitalize", priorityStyles[task.priority])}>
        {task.priority}
      </Badge>
      {task.due ? (
        <Badge variant={overdue ? "destructive" : "secondary"}>
          {overdue ? "Overdue " : ""}
          {task.due}
        </Badge>
      ) : null}
      {task.status !== "done" ? (
        <Button
          size="icon"
          variant="ghost"
          aria-label="Toggle in progress"
          onClick={() =>
            updateTask(task.id, { status: task.status === "in-progress" ? "todo" : "in-progress" })
          }
        >
          {task.status === "in-progress" ? (
            <Check className="size-4 text-primary" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>
      ) : null}
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Delete ${task.title}`}
        onClick={() => removeTask(task.id)}
      >
        <Trash2 className="size-4 text-muted-foreground" />
      </Button>
    </li>
  );
}
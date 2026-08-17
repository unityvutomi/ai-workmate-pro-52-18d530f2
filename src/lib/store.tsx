import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Priority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in-progress" | "done";

export type Task = {
  id: string;
  title: string;
  notes?: string;
  project: string;
  priority: Priority;
  due: string; // YYYY-MM-DD or ""
  estimate?: string;
  status: TaskStatus;
  createdAt: string;
};

export type EmailItem = {
  id: string;
  prompt: string;
  mode: string;
  tone: string;
  content: string;
  createdAt: string;
};

export type MeetingItem = {
  id: string;
  title: string;
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: { task: string; owner: string; due: string; priority: string }[];
  followUps: string[];
  createdAt: string;
};

type State = {
  tasks: Task[];
  emails: EmailItem[];
  meetings: MeetingItem[];
};

const STORAGE_KEY = "awpa-state-v1";
const empty: State = { tasks: [], emails: [], meetings: [] };

type Store = State & {
  addTasks: (tasks: Omit<Task, "id" | "createdAt" | "status">[], status?: TaskStatus) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  addEmail: (email: Omit<EmailItem, "id" | "createdAt">) => void;
  addMeeting: (meeting: Omit<MeetingItem, "id" | "createdAt">) => void;
  removeEmail: (id: string) => void;
  removeMeeting: (id: string) => void;
  clearAll: () => void;
  ready: boolean;
};

const StoreContext = createContext<Store | null>(null);

export const uid = () => Math.random().toString(36).slice(2, 10);
export const todayISO = () => new Date().toISOString().slice(0, 10);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...empty, ...(JSON.parse(raw) as State) });
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota */
    }
  }, [state, ready]);

  const value = useMemo<Store>(
    () => ({
      ...state,
      ready,
      addTasks: (tasks, status = "todo") =>
        setState((s) => ({
          ...s,
          tasks: [
            ...tasks.map((t) => ({
              ...t,
              id: uid(),
              status,
              createdAt: new Date().toISOString(),
            })),
            ...s.tasks,
          ],
        })),
      updateTask: (id, patch) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeTask: (id) => setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
      addEmail: (email) =>
        setState((s) => ({
          ...s,
          emails: [{ ...email, id: uid(), createdAt: new Date().toISOString() }, ...s.emails].slice(
            0,
            50,
          ),
        })),
      addMeeting: (meeting) =>
        setState((s) => ({
          ...s,
          meetings: [
            { ...meeting, id: uid(), createdAt: new Date().toISOString() },
            ...s.meetings,
          ].slice(0, 50),
        })),
      removeEmail: (id) => setState((s) => ({ ...s, emails: s.emails.filter((e) => e.id !== id) })),
      removeMeeting: (id) =>
        setState((s) => ({ ...s, meetings: s.meetings.filter((m) => m.id !== id) })),
      clearAll: () => setState(empty),
    }),
    [state, ready],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function productivityScore(tasks: Task[]) {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter(
    (t) => t.status !== "done" && t.due && t.due < todayISO(),
  ).length;
  const base = (done / tasks.length) * 100;
  return Math.max(5, Math.min(100, Math.round(base - overdue * 6 + 12)));
}

export function workspaceContext(state: {
  tasks: Task[];
  emails: EmailItem[];
  meetings: MeetingItem[];
}) {
  const open = state.tasks.filter((t) => t.status !== "done");
  return [
    `Today: ${todayISO()}`,
    `Open tasks (${open.length}): ${
      open
        .slice(0, 15)
        .map((t) => `${t.title} [${t.priority}${t.due ? `, due ${t.due}` : ""}]`)
        .join("; ") || "none"
    }`,
    `Recent meetings: ${state.meetings.slice(0, 3).map((m) => m.title).join("; ") || "none"}`,
    `Recent emails drafted: ${state.emails.slice(0, 3).map((e) => e.prompt.slice(0, 60)).join("; ") || "none"}`,
  ].join("\n");
}
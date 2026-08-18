# AI Workplace Productivity Assistant

A modern, responsive SaaS-style web app that helps professionals save time, organise their work,
and automate everyday workplace tasks with AI.

Live app: https://ai-workmate-pro-52.lovable.app

## Features

- **Dashboard** — productivity score, open tasks, upcoming deadlines and recent AI output at a glance.
- **Smart Emails** — generate, rewrite, fix grammar, propose subject lines, and summarise email threads
  with tone and length controls.
- **Meeting Summarizer** — turns messy notes or transcripts into an executive summary, key points,
  decisions and owned action items (convertible into tasks in one click).
- **AI Task Planner** — describe a goal in plain language and get a prioritised, dated task breakdown.
- **Tasks** — board grouped into Today, Upcoming, In progress and Completed.
- **Insights** — workload and priority charts plus AI coaching based on your actual data.
- **History** — local archive of every generated email and meeting summary.
- **Settings** — profile, assistant preferences, data export and reset.
- **Floating AI assistant** — context-aware chat available on every page.
- **Light / dark mode** throughout.

## Tech stack

- TanStack Start + TanStack Router (file-based routing, server functions)
- React 19 + TypeScript
- Tailwind CSS v4 with an OKLCH semantic token design system
- shadcn/ui + Radix primitives, lucide icons, Recharts
- Lovable AI Gateway (`google/gemini-3.6-flash`) for all AI features
- Vite 7 build, deployed to an edge runtime

## Project structure

```text
src/
  routes/            file-based routes (/, /emails, /meetings, /planner,
                     /tasks, /insights, /history, /settings) + __root.tsx shell
  components/app/    AppShell, PageHeader, AssistantWidget, TaskRow, Markdown, theme
  components/ui/     shadcn/ui primitives
  lib/
    ai.functions.ts  server functions: composeEmail, summarizeMeeting, planTasks, assistantChat
    ai.server.ts     AI Gateway client, error handling, JSON parsing
    store.tsx        app state (tasks, emails, meetings) persisted to localStorage
  styles.css         design tokens and global styles
```

## Data & privacy

Tasks, drafted emails and meeting summaries are stored in the browser's `localStorage` — nothing is
persisted server-side. Prompts are sent to the AI Gateway only when you trigger a generation.

## Development

Requires Node.js 20+ and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

The app runs at http://localhost:8080.

| Script | Purpose |
| --- | --- |
| `npm run dev` | start the dev server |
| `npm run build` | production build |
| `npm run preview` | preview the production build |
| `npm run lint` | lint the codebase |
| `npm run format` | format with Prettier |

### Environment

AI calls require `LOVABLE_API_KEY` in the server environment. On Lovable this is injected
automatically; running locally outside Lovable, set it in a `.env` file.

## Deployment

Open the project in [Lovable](https://lovable.dev) and hit Publish. The repository stays in two-way
sync, so changes pushed to GitHub appear in Lovable and vice versa.

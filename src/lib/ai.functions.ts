import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const emailInput = z.object({
  instruction: z.string().min(1),
  mode: z.enum(["generate", "rewrite", "subject", "grammar", "summarize"]).default("generate"),
  tone: z.string().default("professional"),
  length: z.string().default("medium"),
});

export const composeEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => emailInput.parse(input))
  .handler(async ({ data }) => {
    const { callGateway } = await import("./ai.server");
    const taskByMode: Record<string, string> = {
      generate: "Write a complete, ready-to-send email based on the user's request.",
      rewrite: "Rewrite the user's email text, keeping the meaning but improving the writing.",
      subject: "Propose 5 strong subject lines for the user's email, as a numbered list only.",
      grammar:
        "Fix grammar, spelling and punctuation in the user's text. Keep the wording and voice as close to the original as possible.",
      summarize:
        "Summarize the email conversation the user pasted: a 2-3 sentence summary, then bullet points of the key requests and any needed replies.",
    };
    const content = await callGateway([
      {
        role: "system",
        content: `You are an expert workplace writing assistant. ${taskByMode[data.mode]}
Tone: ${data.tone}. Length: ${data.length}.
Return only the email content in clean markdown, starting with "Subject: ..." when writing a full email. No preamble, no explanation, no placeholders unless information is genuinely missing (then use [brackets]).`,
      },
      { role: "user", content: data.instruction },
    ]);
    return { content };
  });

const meetingSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  keyPoints: z.array(z.string()),
  decisions: z.array(z.string()),
  actionItems: z.array(
    z.object({ task: z.string(), owner: z.string(), due: z.string(), priority: z.string() }),
  ),
  followUps: z.array(z.string()),
});
export type MeetingAnalysis = z.infer<typeof meetingSchema>;

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ transcript: z.string().min(10) }).parse(input))
  .handler(async ({ data }) => {
    const { callGateway, parseJson } = await import("./ai.server");
    const raw = await callGateway(
      [
        {
          role: "system",
          content: `You analyse meeting transcripts and notes. Respond with JSON only, matching:
{"title":string,"executiveSummary":string,"keyPoints":string[],"decisions":string[],"actionItems":[{"task":string,"owner":string,"due":string,"priority":"high"|"medium"|"low"}],"followUps":string[]}
Use "Unassigned" when no owner is named and "No date" when no deadline is stated. Be specific and concise.`,
        },
        { role: "user", content: data.transcript.slice(0, 20000) },
      ],
      true,
    );
    const parsed = parseJson<unknown>(raw, {});
    const result = meetingSchema.safeParse(parsed);
    if (!result.success) {
      return {
        title: "Meeting summary",
        executiveSummary: raw.slice(0, 800),
        keyPoints: [],
        decisions: [],
        actionItems: [],
        followUps: [],
      } satisfies MeetingAnalysis;
    }
    return result.data;
  });

const planSchema = z.object({
  project: z.string(),
  insight: z.string(),
  tasks: z.array(
    z.object({
      title: z.string(),
      priority: z.enum(["high", "medium", "low"]).catch("medium"),
      due: z.string(),
      estimate: z.string(),
      notes: z.string().default(""),
    }),
  ),
});
export type TaskPlan = z.infer<typeof planSchema>;

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ goal: z.string().min(3), today: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { callGateway, parseJson } = await import("./ai.server");
    const raw = await callGateway(
      [
        {
          role: "system",
          content: `You are a productivity planner. Today is ${data.today}. Break the user's goal into 3-8 concrete, actionable tasks ordered by what to do first. Respond with JSON only:
{"project":string,"insight":string,"tasks":[{"title":string,"priority":"high"|"medium"|"low","due":"YYYY-MM-DD","estimate":string,"notes":string}]}
Deadlines must be realistic dates on or after today. "insight" is one sentence of practical advice.`,
        },
        { role: "user", content: data.goal },
      ],
      true,
    );
    const parsed = planSchema.safeParse(parseJson<unknown>(raw, {}));
    if (!parsed.success) {
      return { project: data.goal.slice(0, 60), insight: "", tasks: [] } satisfies TaskPlan;
    }
    return parsed.data;
  });

export const assistantChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        messages: z.array(
          z.object({ role: z.enum(["user", "assistant"]), content: z.string() }),
        ),
        context: z.string().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { callGateway } = await import("./ai.server");
    const content = await callGateway([
      {
        role: "system",
        content: `You are the in-app AI assistant of a workplace productivity platform. Give concise, practical, workplace-focused answers in markdown. Prefer short bullet lists. Never invent data you were not given.
Current user workspace context:\n${data.context || "No data yet."}`,
      },
      ...data.messages,
    ]);
    return { content };
  });
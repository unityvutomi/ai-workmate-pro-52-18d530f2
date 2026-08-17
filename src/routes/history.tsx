import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, History as HistoryIcon, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { Markdown } from "@/components/app/Markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Workplace AI" },
      {
        name: "description",
        content:
          "Revisit every email draft and meeting summary the assistant generated, with full text and quick copy.",
      },
      { property: "og:title", content: "History — Workplace AI" },
      {
        property: "og:description",
        content: "All your AI-generated emails and meeting summaries in one archive.",
      },
    ],
  }),
  component: HistoryPage,
});

const fmt = (iso: string) => new Date(iso).toLocaleString();

function HistoryPage() {
  const { emails, meetings, removeEmail, removeMeeting } = useStore();

  return (
    <>
      <PageHeader
        icon={<HistoryIcon className="size-5" />}
        title="History"
        description="Everything the assistant has produced for you, kept locally on this device."
      />

      <Tabs defaultValue="emails">
        <TabsList className="bg-secondary">
          <TabsTrigger value="emails">Emails ({emails.length})</TabsTrigger>
          <TabsTrigger value="meetings">Meetings ({meetings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="mt-4">
          {emails.length === 0 ? (
            <EmptyState
              icon={<Mail className="size-5" />}
              title="No emails yet"
              description="Drafts you generate in Smart Emails are archived here."
            />
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {emails.map((e) => (
                <AccordionItem key={e.id} value={e.id} className="surface-card px-4">
                  <AccordionTrigger className="text-left text-sm">
                    <span className="flex-1 truncate">{e.prompt}</span>
                    <Badge variant="secondary" className="mr-2 capitalize">
                      {e.tone}
                    </Badge>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">{fmt(e.createdAt)}</p>
                    <Markdown>{e.content}</Markdown>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await navigator.clipboard.writeText(e.content);
                          toast.success("Copied");
                        }}
                      >
                        Copy
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeEmail(e.id)}>
                        <Trash2 className="size-4" /> Delete
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="meetings" className="mt-4">
          {meetings.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck className="size-5" />}
              title="No meeting summaries yet"
              description="Summaries you create in the Meeting Summarizer are archived here."
            />
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {meetings.map((m) => (
                <AccordionItem key={m.id} value={m.id} className="surface-card px-4">
                  <AccordionTrigger className="text-left text-sm">
                    <span className="flex-1 truncate">{m.title}</span>
                    <Badge variant="secondary" className="mr-2">
                      {m.actionItems.length} actions
                    </Badge>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p className="text-xs text-muted-foreground">{fmt(m.createdAt)}</p>
                    <p>{m.executiveSummary}</p>
                    {m.keyPoints.length ? (
                      <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                        {m.keyPoints.map((k, i) => (
                          <li key={i}>{k}</li>
                        ))}
                      </ul>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={() => removeMeeting(m.id)}>
                      <Trash2 className="size-4" /> Delete
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
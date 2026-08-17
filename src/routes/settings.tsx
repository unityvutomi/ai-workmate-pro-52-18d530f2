import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { useTheme } from "@/components/app/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Workplace AI" },
      {
        name: "description",
        content:
          "Manage your profile, default writing tone, appearance, notifications and workspace data.",
      },
      { property: "og:title", content: "Settings — Workplace AI" },
      {
        property: "og:description",
        content: "Personalise tone defaults, theme and workspace data handling.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { clearAll, tasks, emails, meetings } = useStore();
  const [name, setName] = useState("Alex Morgan");
  const [role, setRole] = useState("Product Manager");
  const [tone, setTone] = useState("professional");
  const [digest, setDigest] = useState(true);

  function exportData() {
    const blob = new Blob([JSON.stringify({ tasks, emails, meetings }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workplace-ai-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  }

  return (
    <>
      <PageHeader
        icon={<SettingsIcon className="size-5" />}
        title="Settings"
        description="Tune how the assistant writes for you and how your workspace behaves."
      />

      <section className="surface-card space-y-4 p-5">
        <h2 className="text-sm font-semibold">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
        </div>
        <Button size="sm" onClick={() => toast.success("Profile saved")}>
          Save profile
        </Button>
      </section>

      <section className="surface-card space-y-4 p-5">
        <h2 className="text-sm font-semibold">Assistant preferences</h2>
        <div className="space-y-2 sm:max-w-xs">
          <Label>Default writing tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["professional", "friendly", "concise", "persuasive"].map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Daily focus digest</p>
            <p className="text-xs text-muted-foreground">
              A morning summary of priorities and deadlines.
            </p>
          </div>
          <Switch checked={digest} onCheckedChange={setDigest} aria-label="Daily focus digest" />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-xs text-muted-foreground">Currently {theme}.</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggle} aria-label="Dark mode" />
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <h2 className="text-sm font-semibold">Workspace data</h2>
        <p className="text-sm text-muted-foreground">
          Your tasks, drafts and summaries are stored on this device. Export them anytime or start
          fresh.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={exportData}>
            Export data
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              clearAll();
              toast.success("Workspace cleared");
            }}
          >
            Clear all data
          </Button>
        </div>
      </section>
    </>
  );
}
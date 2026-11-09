"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

interface Rule {
  id: string;
  name: string;
  trigger: string;
  active: boolean;
  actions: string[];
  emailTo: string | null;
  phoneTo: string | null;
  webhookUrl: string | null;
  taskTitle: string | null;
  nextRuleId: string | null;
  lastFiredAt: string | null;
  lastError: string | null;
}

interface Task {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  rule: { name: string };
}

const TRIGGERS = [
  ["ORDER_PAID", "A bill is paid"],
  ["LOW_STOCK", "An ingredient is at or under its reorder level"],
  ["RESERVATION_TODAY", "Reservations are on the book today"],
] as const;

const ACTIONS = [
  ["NOTIFY", "Notify the owner"],
  ["EMAIL", "Email"],
  ["SMS", "SMS"],
  ["WHATSAPP", "WhatsApp"],
  ["WEBHOOK", "Webhook"],
  ["TASK", "Create a task"],
  ["CHAIN", "Run another rule"],
] as const;

export default function AutomationPage() {
  const { branchId } = useBranch();
  const queryClient = useQueryClient();
  const rules = useQuery({
    queryKey: ["automation", branchId],
    queryFn: () => api.get<Rule[]>(`/platform/automation?branchId=${branchId}`),
    enabled: !!branchId,
  });
  const tasks = useQuery({
    queryKey: ["automation-tasks", branchId],
    queryFn: () => api.get<Task[]>(`/platform/automation/tasks?branchId=${branchId}`),
    enabled: !!branchId,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<string>(TRIGGERS[0][0]);
  const [actions, setActions] = useState<string[]>(["NOTIFY"]);
  const [emailTo, setEmailTo] = useState("");
  const [phoneTo, setPhoneTo] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [nextRuleId, setNextRuleId] = useState("");
  const toggle = (action: string) =>
    setActions((current) =>
      current.includes(action) ? current.filter((item) => item !== action) : [...current, action],
    );
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["automation", branchId] });
    void queryClient.invalidateQueries({ queryKey: ["automation-tasks", branchId] });
  };
  const reset = () => {
    setEditingId(null);
    setName("");
    setTrigger(TRIGGERS[0][0]);
    setActions(["NOTIFY"]);
    setEmailTo("");
    setPhoneTo("");
    setWebhookUrl("");
    setTaskTitle("");
    setNextRuleId("");
  };
  const loadEdit = (rule: Rule) => {
    setEditingId(rule.id);
    setName(rule.name);
    setTrigger(rule.trigger);
    setActions(Array.isArray(rule.actions) && rule.actions.length > 0 ? [...rule.actions] : ["NOTIFY"]);
    setEmailTo(rule.emailTo ?? "");
    setPhoneTo(rule.phoneTo ?? "");
    setWebhookUrl(rule.webhookUrl ?? "");
    setTaskTitle(rule.taskTitle ?? "");
    setNextRuleId(rule.nextRuleId ?? "");
  };
  const submit = () => {
    const body = {
      name,
      trigger,
      actions,
      emailTo,
      phoneTo,
      webhookUrl,
      taskTitle,
      nextRuleId,
    };
    const req = editingId
      ? api.put(`/platform/automation/${editingId}?branchId=${branchId}`, body)
      : api.post(`/platform/automation?branchId=${branchId}`, body);
    req
      .then(() => {
        toast.success(editingId ? "Rule updated" : "Rule created");
        reset();
        refresh();
      })
      .catch((error) =>
        toast.error(error instanceof ApiError ? error.message : editingId ? "Could not update" : "Could not add"),
      );
  };
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Automation</h1>
        <p className="text-sm text-muted-foreground">
          A rule checks every five minutes. When it matches, it can notify the owner, send email, SMS, or WhatsApp, call a webhook, open a task, and then run another rule. Email, SMS, and WhatsApp use the addresses stored in Operations.
        </p>
      </div>
      <Card className="flex max-w-3xl flex-col gap-3 p-4">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Rule name" aria-label="Rule name" />
        <select className="h-10 rounded-md border border-input bg-background px-2" value={trigger} onChange={(event) => setTrigger(event.target.value)} aria-label="Trigger">
          {TRIGGERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <div className="flex flex-wrap gap-3 text-sm" role="group" aria-label="Actions">
          {ACTIONS.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input type="checkbox" checked={actions.includes(value)} onChange={() => toggle(value)} />
              {label}
            </label>
          ))}
        </div>
        {actions.includes("EMAIL") && (
          <Input value={emailTo} onChange={(event) => setEmailTo(event.target.value)} placeholder="Email, or leave blank for the owner" aria-label="Email" />
        )}
        {(actions.includes("SMS") || actions.includes("WHATSAPP")) && (
          <Input value={phoneTo} onChange={(event) => setPhoneTo(event.target.value)} placeholder="Phone, or leave blank for the owner" aria-label="Phone" />
        )}
        {actions.includes("WEBHOOK") && (
          <Input value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder="https://example.com/hooks/automation" aria-label="Webhook URL" />
        )}
        {actions.includes("TASK") && (
          <Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task title" aria-label="Task title" />
        )}
        {actions.includes("CHAIN") && (
          <select className="h-10 rounded-md border border-input bg-background px-2" value={nextRuleId} onChange={(event) => setNextRuleId(event.target.value)} aria-label="Next rule">
            <option value="">Rule to run next</option>
            {(rules.data ?? []).filter((rule) => rule.id !== editingId).map((rule) => <option key={rule.id} value={rule.id}>{rule.name}</option>)}
          </select>
        )}
        <div className="flex gap-2">
          <Button type="button" disabled={!name.trim()} onClick={submit}>
            {editingId ? "Save" : "Create"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </Card>
      <div className="grid gap-3">
        {(rules.data ?? []).map((rule) => (
          <Card key={rule.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{rule.name}</p>
              <p className="text-sm text-muted-foreground">
                {TRIGGERS.find((row) => row[0] === rule.trigger)?.[1] ?? rule.trigger}
                {" · "}
                {(Array.isArray(rule.actions) ? rule.actions : ["NOTIFY"]).join(", ")}
                {" · "}
                {rule.active ? "On" : "Off"}
                {rule.lastFiredAt ? ` · last ${new Date(rule.lastFiredAt).toLocaleString()}` : ""}
              </p>
              {rule.lastError ? <p className="text-sm text-destructive">{rule.lastError}</p> : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => loadEdit(rule)}>
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  api
                    .put(`/platform/automation/${rule.id}?branchId=${branchId}`, { active: !rule.active })
                    .then(() => refresh())
                    .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not update"))
                }
              >
                {rule.active ? "Pause" : "Resume"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!confirm(`Delete ${rule.name}?`)) return;
                  api
                    .delete(`/platform/automation/${rule.id}?branchId=${branchId}`)
                    .then(() => {
                      toast.success("Rule deleted");
                      if (editingId === rule.id) reset();
                      refresh();
                    })
                    .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not delete"));
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-lg font-medium">Open tasks</h2>
        {(tasks.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No open tasks.</p>
        ) : (
          (tasks.data ?? []).map((task) => (
            <div key={task.id} className="flex items-start justify-between gap-3 border-t border-border pt-3 text-sm">
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-muted-foreground">{task.body}</p>
                <p className="text-xs text-muted-foreground">{task.rule.name} · {new Date(task.createdAt).toLocaleString()}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  api
                    .put(`/platform/automation/tasks/${task.id}?branchId=${branchId}`)
                    .then(() => refresh())
                    .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not close the task"))
                }
              >
                Done
              </Button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

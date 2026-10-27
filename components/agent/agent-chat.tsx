"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";

interface AskResult {
  answer: string;
  source: "records" | "model";
  tools: string[];
}

interface Turn {
  question: string;
  answer: string;
  source: AskResult["source"];
}

export function AgentChat({
  branchId,
  scope,
  title,
  hint,
  suggestions,
  extra,
}: {
  branchId: string | null;
  scope: "branch" | "restaurant";
  title: string;
  hint: string;
  suggestions: string[];
  extra?: React.ReactNode;
}) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (!branchId || trimmed.length < 2 || pending) return;
    setPending(true);
    setError("");
    setQuestion("");
    api
      .post<AskResult>(`/agent/ask?branchId=${branchId}`, { question: trimmed, scope })
      .then((result) => {
        setTurns((current) => [
          ...current,
          { question: trimmed, answer: result.answer, source: result.source },
        ]);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not answer"))
      .finally(() => setPending(false));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight">{title}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{hint}</p>
        </div>
        {extra}
      </div>
      <div className="flex flex-col gap-3">
        {turns.length === 0 && (
          <Card className="p-4 text-sm text-muted-foreground">
            Ask about sales, open orders, late kitchen tickets, low stock, or today’s reservations.
          </Card>
        )}
        {turns.map((turn, index) => (
          <div key={`${turn.question}-${index}`} className="flex flex-col gap-2">
            <p className="text-sm font-medium">{turn.question}</p>
            <Card className="whitespace-pre-wrap p-4 text-sm">{turn.answer}</Card>
            <p className="text-xs text-muted-foreground">
              {turn.source === "model" ? "Phrased from the records by the configured model." : "From the records."}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Button key={suggestion} type="button" variant="outline" disabled={!branchId || pending} onClick={() => ask(suggestion)}>
            {suggestion}
          </Button>
        ))}
      </div>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          ask(question);
        }}
      >
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this restaurant"
          aria-label="Question"
          disabled={!branchId || pending}
        />
        <Button type="submit" disabled={!branchId || pending || question.trim().length < 2}>
          {pending ? "Checking…" : "Ask"}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!branchId && <p className="text-sm text-muted-foreground">Choose a branch first.</p>}
    </div>
  );
}

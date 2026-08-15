"use client";

import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const DEFAULT_SUGGESTED_QUESTIONS = [
  "What is STOP-BANG?",
  "What does my risk level actually mean?",
  "Why does this recommend that action?",
  "How does my fitness trend relate to sleep apnea?",
  "What happens at a sleep study?",
];

const MAX_QUESTION_LENGTH = 300;

interface FollowUpChatProps {
  stopBang: unknown;
  fitness: unknown;
  decision: unknown;
}

export function FollowUpChat({ stopBang, fitness, decision }: FollowUpChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTED_QUESTIONS);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || trimmed.length > MAX_QUESTION_LENGTH || status === "loading") return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", text: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/coach/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopBang, fitness, decision, history: messages, question: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Something went wrong");
      }
      setMessages([...nextMessages, { role: "assistant", text: data.answer as string }]);
      // Suggestions come back grounded in what was just said, not the static bootstrap list —
      // this is what keeps the chips relevant instead of frozen after the first message.
      const nextSuggestions = data.suggestedFollowUps as string[] | undefined;
      if (nextSuggestions && nextSuggestions.length > 0) {
        setSuggestions(nextSuggestions);
      }
      setStatus("idle");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Ask AeroCoach a follow-up</p>

      {messages.length > 0 && (
        <div className="space-y-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                m.role === "user"
                  ? "ml-auto bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              {m.text}
            </div>
          ))}
          {status === "loading" && (
            <div className="max-w-[85%] rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500">
              Thinking…
            </div>
          )}
        </div>
      )}

      {status !== "loading" && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((q) => (
            <button
              key={q}
              onClick={() => ask(q)}
              className="rounded-full border border-zinc-300 px-2.5 py-1 text-[11px] text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {errorMessage && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="Ask a question about your result…"
          disabled={status === "loading"}
          className="flex-1 rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={status === "loading" || !input.trim()}
          className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Send
        </button>
      </form>

      <p className="text-[10px] text-zinc-500 dark:text-zinc-500">
        AeroCoach can explain your result, not diagnose you — for anything beyond this screening, talk to a
        healthcare provider.
      </p>
    </div>
  );
}

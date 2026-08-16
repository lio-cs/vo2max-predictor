"use client";

import { useEffect, useRef, useState } from "react";

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
  oxygen: unknown;
  decision: unknown;
}

export function FollowUpChat({ stopBang, fitness, oxygen, decision }: FollowUpChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTED_QUESTIONS);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redactionNotice, setRedactionNotice] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Keeps the latest message in view as the thread grows, instead of the user having to scroll
  // down inside the capped-height thread themselves after every answer.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, status]);

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
        body: JSON.stringify({ stopBang, fitness, oxygen, decision, history: messages, question: trimmed }),
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
      if (data.redacted) setRedactionNotice(true);
      setStatus("idle");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-hairline bg-paper p-4">
      <p className="font-display text-base font-medium text-ink">Ask AeroCoach a follow-up</p>

      {messages.length > 0 && (
        // Capped height + internal scroll so a long conversation stays a fixed-size panel
        // instead of pushing the rest of the page down indefinitely — matters most on phone.
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                m.role === "user" ? "ml-auto bg-ink text-paper" : "bg-paper-alt text-ink"
              }`}
            >
              {m.text}
            </div>
          ))}
          {status === "loading" && (
            <div className="max-w-[85%] rounded-lg bg-paper-alt px-3 py-2 text-xs text-ink-faint">
              Thinking…
            </div>
          )}
          <div ref={threadEndRef} />
        </div>
      )}

      {status !== "loading" && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((q) => (
            <button
              key={q}
              onClick={() => ask(q)}
              className="rounded-full border border-hairline px-2.5 py-1 text-[11px] text-ink-soft transition-colors hover:border-accent hover:text-accent-ink disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {errorMessage && (
        <p className="rounded-lg bg-paper-alt px-3 py-2 text-xs text-ink-soft">{errorMessage}</p>
      )}

      {redactionNotice && (
        <p className="rounded-lg bg-paper-alt px-3 py-2 text-[11px] text-ink-faint">
          We removed what looked like contact info (email/phone) from a message before sending it to the AI.
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
          className="flex-1 rounded-full border border-hairline bg-paper px-3 py-1.5 text-xs text-ink disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading" || !input.trim()}
          className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-accent disabled:opacity-50"
        >
          Send
        </button>
      </form>

      <p className="text-[10px] text-ink-faint">
        AeroCoach can explain your result, not diagnose you — for anything beyond this screening, talk to a
        healthcare provider.
      </p>
    </div>
  );
}

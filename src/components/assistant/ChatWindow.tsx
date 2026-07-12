import { useCallback, useState } from "react";
import { MessageList } from "./MessageList";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { Composer } from "./Composer";
import { simulateReply } from "./suggestions";
import type { ChatMessage } from "./types";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || isLoading) return;

      const userMessage: ChatMessage = { id: createId(), role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setError(null);
      setIsLoading(true);

      try {
        const reply = await simulateReply(text);
        setMessages((prev) => [
          ...prev,
          { id: createId(), role: "assistant", content: reply },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  return (
    <div className="flex h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          <span className="text-sm font-medium text-foreground">Commercial Knowledge Assistant</span>
        </div>
        <span className="text-xs text-muted-foreground">beta</span>
      </div>
      <MessageList messages={messages} isLoading={isLoading} error={error} />
      <SuggestedQuestions onSelect={sendMessage} disabled={isLoading} />
      <Composer
        value={input}
        onChange={setInput}
        onSubmit={() => sendMessage(input)}
        disabled={isLoading}
      />
    </div>
  );
}
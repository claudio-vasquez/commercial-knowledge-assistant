import { useEffect, useRef } from "react";
import type { ChatMessage } from "./types";

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export function MessageList({ messages, isLoading, error }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, error]);

  if (messages.length === 0 && !isLoading && !error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full border border-border">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden />
        </div>
        <p className="text-sm font-medium text-foreground">¿En qué puedo ayudarte?</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Escribe tu pregunta o elige una de las sugerencias para empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
            Pensando<span className="animate-pulse">...</span>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-muted-foreground">{error}</p>}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl bg-foreground px-4 py-2 text-sm text-background"
            : "max-w-[85%] rounded-2xl bg-muted px-4 py-2 text-sm text-foreground"
        }
      >
        {message.content}
      </div>
    </div>
  );
}
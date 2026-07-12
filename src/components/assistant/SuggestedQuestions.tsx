import { SUGGESTED_QUESTIONS } from "./suggestions";

interface Props {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({ onSelect, disabled }: Props) {
  return (
    <div className="border-t border-border px-4 py-4 sm:px-6">
      <p className="text-xs text-muted-foreground">Preguntas sugeridas</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSelect(q)}
            disabled={disabled}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
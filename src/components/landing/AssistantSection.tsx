import { ChatWindow } from "@/components/assistant/ChatWindow";

export function AssistantSection() {
  return (
    <section id="asistente" className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="text-sm text-muted-foreground">Asistente</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pregunta sobre mis servicios.
          </h2>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Un asistente entrenado sobre mi oferta responderá dudas frecuentes: alcance, tiempos, precios, y si tu caso encaja.
          </p>
          <p className="mt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Beta — respuestas simuladas
          </p>
        </div>
        <ChatWindow />
      </div>
    </section>
  );
}
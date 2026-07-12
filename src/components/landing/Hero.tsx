import { DIAGNOSTIC_MAILTO } from "@/lib/contact";

export function Hero() {
  return (
    <section id="top" className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center sm:pt-28 sm:pb-32">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-foreground/80">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
        Consultoría B2B · IA aplicada
      </div>
      <h1 className="mx-auto mt-8 max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
        Encuentra y elimina la fricción que frena tu venta B2B.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
        Diagnóstico basado en evidencia, intervenciones de alcance fijo y automatización con IA aplicada solo donde mueve revenue.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={DIAGNOSTIC_MAILTO}
          className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Agenda un Diagnóstico Express
        </a>
        <a
          href="#metodologia"
          className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Ver metodología
        </a>
      </div>
    </section>
  );
}
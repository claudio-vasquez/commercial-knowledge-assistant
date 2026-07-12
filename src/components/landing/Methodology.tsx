const steps = [
  {
    id: "01",
    title: "Diagnóstico basado en evidencia",
    description:
      "Analizo tu pipeline, procesos y datos reales para identificar dónde se pierde revenue — sin suposiciones ni frameworks genéricos.",
  },
  {
    id: "02",
    title: "Intervenciones de alcance fijo",
    description:
      "Proyectos con entregables y tiempos claros. Nada abierto, nada ambiguo: sabes qué recibes y cuándo.",
  },
  {
    id: "03",
    title: "IA aplicada donde mueve revenue",
    description:
      "Automatización con IA solo en los puntos donde acorta ciclos, reduce fricción o libera tiempo comercial de alto valor.",
  },
];

export function Methodology() {
  return (
    <section id="metodologia" className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <p className="text-sm text-muted-foreground">Metodología</p>
      <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Simple, medible y con foco en revenue.
      </h2>
      <p className="mt-4 max-w-2xl text-base text-muted-foreground">
        Una práctica personal, no una agencia. Trabajas directamente conmigo en cada etapa.
      </p>
      <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
        {steps.map((step) => (
          <div key={step.id}>
            <div className="border-t border-border pt-6">
              <p className="font-mono text-xs text-muted-foreground">{step.id}</p>
              <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
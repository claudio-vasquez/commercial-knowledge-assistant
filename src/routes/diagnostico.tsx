import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import {
  CONTEXT_QUESTIONS,
  MEASURED_QUESTIONS,
  findOption,
  getDimension,
  getLibrary,
  nextReactiveMoment,
  resolve,
} from "@/lib/diagnostic/engine";
import { contract, type Answers, type DimensionId } from "@/lib/diagnostic/types";

export const Route = createFileRoute("/diagnostico")({
  head: () => ({
    meta: [
      { title: "Chequeo del Motor Comercial — Claudio Vásquez" },
      {
        name: "description",
        content:
          "Una lectura priorizada de tu motor comercial en menos de tres minutos. La primera lectura es gratis y la ves antes de dejar ningún dato.",
      },
      { property: "og:title", content: "Chequeo del Motor Comercial — Claudio Vásquez" },
      {
        property: "og:description",
        content: "Una lectura priorizada de tu motor comercial: dónde mirar primero y qué posponer.",
      },
    ],
  }),
  component: DiagnosticoPage,
});

type Phase = "intro" | "questions" | "partial" | "gate" | "full";

const ALL_QUESTIONS = [...CONTEXT_QUESTIONS, ...MEASURED_QUESTIONS];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function DiagnosticoPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [reactiveShown, setReactiveShown] = useState<Set<string>>(new Set());
  const [reactive, setReactive] = useState<{ id: string; text: string } | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        {phase === "intro" && <IntroStep onStart={() => setPhase("questions")} />}
        {phase === "questions" && (
          <QuestionsStep
            idx={idx}
            setIdx={setIdx}
            answers={answers}
            setAnswers={setAnswers}
            reactive={reactive}
            setReactive={setReactive}
            reactiveShown={reactiveShown}
            setReactiveShown={setReactiveShown}
            onComplete={() => setPhase("partial")}
          />
        )}
        {phase === "partial" && (
          <PartialStep
            answers={answers}
            onContinue={() => setPhase("gate")}
            onBack={() => {
              setPhase("questions");
              setIdx(ALL_QUESTIONS.length - 1);
            }}
          />
        )}
        {phase === "gate" && (
          <GateStep
            answers={answers}
            onSuccess={() => setPhase("full")}
            onBack={() => setPhase("partial")}
          />
        )}
        {phase === "full" && <FullReportStep answers={answers} />}
      </main>
      <Footer />
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8 flex items-center gap-2" aria-label={`Paso ${current} de ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full ${i < current ? "bg-foreground" : "bg-border"}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

function IntroStep({ onStart }: { onStart: () => void }) {
  const intro = contract.content.intro;
  return (
    <div>
      <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
        Chequeo del Motor Comercial
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {intro.headline_promise}
      </h1>
      <p className="mt-4 text-base text-muted-foreground">{intro.cost_line}</p>
      <p className="mt-2 text-base text-muted-foreground">{intro.value_first_line}</p>
      <p className="mt-6 text-sm text-muted-foreground">{intro.unknown_hint}</p>
      <div className="mt-8">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Empezar el chequeo
        </button>
      </div>
    </div>
  );
}

function QuestionsStep(props: {
  idx: number;
  setIdx: (n: number) => void;
  answers: Answers;
  setAnswers: (a: Answers) => void;
  reactive: { id: string; text: string } | null;
  setReactive: (r: { id: string; text: string } | null) => void;
  reactiveShown: Set<string>;
  setReactiveShown: (s: Set<string>) => void;
  onComplete: () => void;
}) {
  const {
    idx,
    setIdx,
    answers,
    setAnswers,
    reactive,
    setReactive,
    reactiveShown,
    setReactiveShown,
    onComplete,
  } = props;
  const question = ALL_QUESTIONS[idx];
  const selected = answers[question.id];

  const pick = (optId: string) => {
    const next = { ...answers, [question.id]: optId };
    setAnswers(next);
    // Compute reactive after this answer
    if (!reactiveShown.has("_check_" + question.id)) {
      const moment = nextReactiveMoment(question.id, next, reactiveShown);
      if (moment && !reactiveShown.has(moment.id)) {
        setReactive(moment);
        const s = new Set(reactiveShown);
        s.add(moment.id);
        setReactiveShown(s);
        return; // pause on reactive
      }
    }
    advance();
  };

  const advance = () => {
    setReactive(null);
    if (idx < ALL_QUESTIONS.length - 1) {
      setIdx(idx + 1);
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    setReactive(null);
    if (idx > 0) setIdx(idx - 1);
  };

  return (
    <div>
      <StepIndicator current={idx + 1} total={ALL_QUESTIONS.length} />
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
        Pregunta {idx + 1} de {ALL_QUESTIONS.length}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {question.text}
      </h2>

      {reactive ? (
        <div className="mt-8 rounded-md border border-border bg-muted/30 p-5">
          <p className="text-sm text-foreground">{reactive.text}</p>
          <div className="mt-4">
            <button
              type="button"
              onClick={advance}
              className="inline-flex h-10 items-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Continuar
            </button>
          </div>
        </div>
      ) : (
        <fieldset className="mt-6 space-y-3">
          <legend className="sr-only">{question.text}</legend>
          {question.options.map((opt) => {
            const isSel = selected === opt.id;
            return (
              <label
                key={opt.id}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 text-sm transition-colors focus-within:ring-2 focus-within:ring-foreground/20 ${
                  isSel
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:border-foreground/60"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={opt.id}
                  checked={isSel}
                  onChange={() => pick(opt.id)}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="text-foreground">{opt.label}</span>
              </label>
            );
          })}
        </fieldset>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={idx === 0}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Atrás
        </button>
        {!reactive && selected && (
          <button
            type="button"
            onClick={advance}
            className="inline-flex h-10 items-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {idx === ALL_QUESTIONS.length - 1 ? "Ver mi lectura" : "Siguiente"}
          </button>
        )}
      </div>
    </div>
  );
}

function PartialStep({
  answers,
  onContinue,
  onBack,
}: {
  answers: Answers;
  onContinue: () => void;
  onBack: () => void;
}) {
  const result = useMemo(() => resolve(answers), [answers]);
  const trace = contract.content.templates.partial_result.trace_line.replace(
    "{evidence_answer_labels}",
    result.evidenceLabels.join(", ") || "las respuestas que entregaste",
  );

  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
        Lectura parcial · gratis
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Lo que se dibuja con lo que declaraste
      </h2>

      {result.outcome === "sin_restriccion_clara" ? (
        <PartialSinRestriccion trace={trace} />
      ) : result.outcome === "co_dominancia" ? (
        <PartialCoDominancia dims={result.dominantDimensions} trace={trace} answers={answers} />
      ) : (
        <PartialDominante dim={result.dominantDimension!} trace={trace} answers={answers} />
      )}

      <div className="mt-10 rounded-md border border-border bg-muted/30 p-6">
        <p className="text-sm text-foreground">{contract.content.templates.gate.freedom_text}</p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Volver a mis respuestas
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-11 items-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Quiero el informe completo
        </button>
      </div>
    </div>
  );
}

function PartialDominante({
  dim,
  trace,
  answers,
}: {
  dim: DimensionId;
  trace: string;
  answers: Answers;
}) {
  const lib = getLibrary(dim);
  const dimension = getDimension(dim);
  const outsideIcp = answers["c1_tamano"] === "c1_gt_100";
  const d3SmallCompany = dim === "d3_consistencia" && answers["c1_tamano"] === "c1_lt_10";
  const leadIn = d3SmallCompany ? lib.context_variants["d3_variant_etapa"]?.lead_in : null;

  return (
    <div className="mt-6 space-y-6">
      <div>
        <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
          Patrón observado
        </p>
        <p className="mt-2 text-lg font-medium text-foreground">
          {dimension.name_public} — {lib.pattern_name}
        </p>
      </div>
      {leadIn && <p className="text-base text-muted-foreground">{leadIn}</p>}
      <p className="text-base text-foreground">{lib.partial.reading}</p>
      <div>
        <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
          Por qué aparece
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{trace}</p>
      </div>
      <div>
        <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
          Hipótesis inicial
        </p>
        <p className="mt-2 text-base text-foreground">{lib.partial.hypothesis}</p>
      </div>
      <div>
        <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
          Algo que puedes hacer hoy
        </p>
        <p className="mt-2 text-base text-foreground">{lib.partial.micro_help}</p>
      </div>
      {outsideIcp && (
        <p className="text-sm italic text-muted-foreground">{contract.content.notes.outside_icp}</p>
      )}
    </div>
  );
}

function PartialCoDominancia({
  dims,
  trace,
  answers,
}: {
  dims: DimensionId[];
  trace: string;
  answers: Answers;
}) {
  const outsideIcp = answers["c1_tamano"] === "c1_gt_100";
  return (
    <div className="mt-6 space-y-8">
      <p className="text-base text-foreground">
        Tu motor muestra dos frentes con fuerza similar. No hay que atacar los dos a la vez.
      </p>
      <div>
        <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
          Por qué aparecen
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{trace}</p>
      </div>
      {dims.map((d, i) => {
        const lib = getLibrary(d);
        const dimension = getDimension(d);
        return (
          <div key={d} className="border-t border-border pt-6">
            <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
              Frente {i + 1}
            </p>
            <p className="mt-2 text-lg font-medium text-foreground">
              {dimension.name_public} — {lib.pattern_name}
            </p>
            <p className="mt-3 text-base text-foreground">{lib.partial.reading}</p>
            <p className="mt-3 text-base text-foreground">{lib.partial.hypothesis}</p>
            <p className="mt-3 text-sm text-muted-foreground">{lib.partial.micro_help}</p>
          </div>
        );
      })}
      {outsideIcp && (
        <p className="text-sm italic text-muted-foreground">{contract.content.notes.outside_icp}</p>
      )}
    </div>
  );
}

function PartialSinRestriccion({ trace }: { trace: string }) {
  const o = contract.content.outcomes.sin_restriccion_clara;
  return (
    <div className="mt-6 space-y-5">
      <p className="text-lg font-medium text-foreground">{o.title}</p>
      <p className="text-base text-foreground">{o.reading}</p>
      <div>
        <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
          Por qué aparece
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{trace}</p>
      </div>
      <p className="text-base text-foreground">{o.what_to_watch}</p>
    </div>
  );
}

function GateStep({
  answers,
  onSuccess,
  onBack,
}: {
  answers: Answers;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;

    const n = name.trim();
    const em = email.trim();

    if (!n || !em || !EMAIL_RE.test(em) || !consent) {
      setStatus("error");
      setErrorMsg("Revisa nombre, email y consentimiento.");
      return;
    }

    setStatus("submitting");
    setErrorMsg(null);

    // Honeypot: éxito neutro sin insertar
    if (website.trim() !== "") {
      onSuccess();
      return;
    }

    const result = resolve(answers);
    const contextAnswers: Record<string, string> = {};
    for (const q of CONTEXT_QUESTIONS) if (answers[q.id]) contextAnswers[q.id] = answers[q.id];
    const measuredAnswers: Record<string, string> = {};
    for (const q of MEASURED_QUESTIONS) if (answers[q.id]) measuredAnswers[q.id] = answers[q.id];

    const payload = {
      name: n,
      email: em,
      company: null,
      role: null,
      message: null,
      source: contract.persistence.lead_source_value,
      consent: true,
      metadata: {
        diagnostic: {
          version: contract.meta.version,
          context_answers: contextAnswers,
          measured_answers: measuredAnswers,
          outcome: result.outcome,
          dominant_dimension: result.dominantDimension,
          dominant_dimensions: result.dominantDimensions,
          confidence: result.confidence,
          unknown_count: result.unknownCount,
        },
      },
    };

    const { error } = await supabase.from("leads").insert(payload);
    if (error) {
      setStatus("error");
      setErrorMsg("No pude guardar tus datos en este momento. Inténtalo nuevamente.");
      return;
    }
    onSuccess();
  };

  const inputClass =
    "mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/20";

  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
        Un paso más
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Recibe el informe completo
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">{contract.meta.consent_purpose}</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="d-name" className="text-sm font-medium text-foreground">
            Nombre <span className="text-muted-foreground">*</span>
          </label>
          <input
            id="d-name"
            type="text"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="d-email" className="text-sm font-medium text-foreground">
            Email <span className="text-muted-foreground">*</span>
          </label>
          <input
            id="d-email"
            type="email"
            required
            maxLength={200}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
          />
        </div>

        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="d-website">Website</label>
          <input
            id="d-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border"
          />
          <span>{contract.meta.consent_purpose}</span>
        </label>

        <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Volver a la lectura
          </button>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "submitting" ? "Enviando…" : "Ver informe completo"}
          </button>
        </div>
        {status === "error" && errorMsg && (
          <p className="text-sm text-destructive" role="alert">
            {errorMsg}
          </p>
        )}
      </form>
    </div>
  );
}

function FullReportStep({ answers }: { answers: Answers }) {
  const result = useMemo(() => resolve(answers), [answers]);
  const cta = contract.content.cta;
  const confidenceText = contract.content.confidence[result.confidence];
  const outsideSalesNote = result.modifiers.respondentOutsideSales
    ? contract.content.confidence.modifier_notes.respondent_outside_sales
    : null;

  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
        Informe completo
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Tu lectura priorizada
      </h2>

      {result.outcome === "sin_restriccion_clara" ? (
        <FullSinRestriccion />
      ) : result.outcome === "co_dominancia" ? (
        <FullCoDominancia dims={result.dominantDimensions} answers={answers} />
      ) : (
        <FullDominante dim={result.dominantDimension!} answers={answers} />
      )}

      <div className="mt-10 border-t border-border pt-6">
        <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
          Confianza declarada
        </p>
        <p className="mt-2 text-sm text-foreground">{confidenceText}</p>
        {outsideSalesNote && (
          <p className="mt-2 text-sm text-muted-foreground">{outsideSalesNote}</p>
        )}
      </div>

      <div className="mt-8">
        <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Límites</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {contract.meta.limitations.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>

      <div className="mt-10 rounded-md border border-border bg-muted/30 p-6">
        <p className="text-sm text-foreground">{cta.framing}</p>
        <div className="mt-4">
          <a
            href={cta.target}
            className="inline-flex h-11 items-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {cta.label}
          </a>
        </div>
      </div>

      <div className="mt-8">
        <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}

function FullDominante({ dim, answers }: { dim: DimensionId; answers: Answers }) {
  const lib = getLibrary(dim);
  const dimension = getDimension(dim);
  const d3SmallCompany = dim === "d3_consistencia" && answers["c1_tamano"] === "c1_lt_10";
  const leadIn = d3SmallCompany ? lib.context_variants["d3_variant_etapa"]?.lead_in : null;

  return (
    <div className="mt-6 space-y-8">
      <p className="text-lg font-medium text-foreground">
        {dimension.name_public} — {lib.pattern_name}
      </p>
      {leadIn && <p className="text-base text-muted-foreground">{leadIn}</p>}
      <p className="text-base text-foreground">{lib.partial.reading}</p>
      <p className="text-base text-foreground">{lib.partial.hypothesis}</p>

      <Section title="Primer paso concreto">
        <p className="text-base text-foreground">{lib.partial.micro_help}</p>
      </Section>

      <Section title="Siguientes jugadas">
        <ul className="list-disc space-y-2 pl-5 text-base text-foreground">
          {lib.full.first_moves.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </Section>

      <Section title="Qué posponer">
        <ul className="list-disc space-y-2 pl-5 text-base text-foreground">
          {lib.full.postpone.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </Section>

      <Section title="Cómo confirmar o descartar">
        <p className="text-base text-foreground">{lib.full.how_to_confirm}</p>
        <p className="mt-3 text-sm text-muted-foreground">{lib.rival_hypothesis}</p>
      </Section>

      <Section title="Lo que este chequeo no puede ver">
        <p className="text-base text-muted-foreground">{lib.full.limits}</p>
      </Section>
    </div>
  );
}

function FullCoDominancia({ dims, answers }: { dims: DimensionId[]; answers: Answers }) {
  return (
    <div className="mt-6 space-y-10">
      <p className="text-base text-foreground">{contract.content.outcomes.co_dominancia.guidance}</p>
      {dims.map((d, i) => {
        const lib = getLibrary(d);
        const dimension = getDimension(d);
        const isD3Small = d === "d3_consistencia" && answers["c1_tamano"] === "c1_lt_10";
        const leadIn = isD3Small ? lib.context_variants["d3_variant_etapa"]?.lead_in : null;
        return (
          <div key={d} className="border-t border-border pt-6">
            <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
              Frente {i + 1}
            </p>
            <p className="mt-2 text-lg font-medium text-foreground">
              {dimension.name_public} — {lib.pattern_name}
            </p>
            {leadIn && <p className="mt-3 text-base text-muted-foreground">{leadIn}</p>}
            <p className="mt-3 text-base text-foreground">{lib.partial.reading}</p>
            <p className="mt-3 text-base text-foreground">{lib.partial.hypothesis}</p>
            <Section title="Primer paso concreto">
              <p className="text-base text-foreground">{lib.full.first_moves[0]}</p>
            </Section>
            <Section title="Qué posponer primero">
              <p className="text-base text-foreground">{lib.full.postpone[0]}</p>
            </Section>
            <Section title="Cómo confirmar">
              <p className="text-base text-foreground">{lib.full.how_to_confirm}</p>
            </Section>
          </div>
        );
      })}
    </div>
  );
}

function FullSinRestriccion() {
  const o = contract.content.outcomes.sin_restriccion_clara;
  return (
    <div className="mt-6 space-y-5">
      <p className="text-lg font-medium text-foreground">{o.title}</p>
      <p className="text-base text-foreground">{o.reading}</p>
      <Section title="Qué mirar">
        <p className="text-base text-foreground">{o.what_to_watch}</p>
      </Section>
      <Section title="Qué posponer">
        <p className="text-base text-foreground">{o.postpone}</p>
      </Section>
      <Section title="La parte honesta">
        <p className="text-base text-foreground">{o.honest_note}</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setCompany("");
    setRole("");
    setMessage("");
    setWebsite("");
    setConsent(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;

    const n = name.trim();
    const em = email.trim();
    const co = company.trim();
    const ro = role.trim();
    const msg = message.trim();

    if (!n || !em || !EMAIL_RE.test(em) || !consent) {
      setStatus("error");
      setErrorMsg("Revisa los campos obligatorios.");
      return;
    }

    setStatus("submitting");
    setErrorMsg(null);

    // Honeypot: si tiene valor, mostrar éxito neutro sin insertar.
    if (website.trim() !== "") {
      setStatus("success");
      reset();
      return;
    }

    const { error } = await supabase.from("leads").insert({
      name: n,
      email: em,
      company: co || null,
      role: ro || null,
      message: msg || null,
      source: "landing",
      consent: true,
      metadata: { league: true, challenge: "p2" },
    });

    if (error) {
      setStatus("error");
      setErrorMsg("No pude guardar tus datos en este momento. Inténtalo nuevamente.");
      return;
    }

    setStatus("success");
    reset();
  };

  const inputClass =
    "mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/20";

  return (
    <section id="contacto" className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="text-sm text-muted-foreground">Contacto</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            ¿Crees que algo está frenando tu proceso comercial?
          </h2>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Explícame brevemente tu situación. Revisaré personalmente tu caso para identificar si existe una oportunidad clara de mejora.
          </p>
          <p className="mt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Sin newsletters. Sin secuencias automáticas. Leeré personalmente tu caso.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="lead-name" className="text-sm font-medium text-foreground">
              Nombre <span className="text-muted-foreground">*</span>
            </label>
            <input
              id="lead-name"
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
            <label htmlFor="lead-email" className="text-sm font-medium text-foreground">
              Email <span className="text-muted-foreground">*</span>
            </label>
            <input
              id="lead-email"
              type="email"
              required
              maxLength={200}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="lead-company" className="text-sm font-medium text-foreground">
                Empresa
              </label>
              <input
                id="lead-company"
                type="text"
                maxLength={120}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={inputClass}
                autoComplete="organization"
              />
            </div>
            <div>
              <label htmlFor="lead-role" className="text-sm font-medium text-foreground">
                Cargo
              </label>
              <input
                id="lead-role"
                type="text"
                maxLength={120}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass}
                autoComplete="organization-title"
              />
            </div>
          </div>

          <div>
            <label htmlFor="lead-message" className="text-sm font-medium text-foreground">
              Mensaje
            </label>
            <textarea
              id="lead-message"
              rows={4}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Honeypot: oculto para usuarios reales, visible para bots */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="website">Website</label>
            <input
              id="website"
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
            <span>
              Usaré estos datos únicamente para responderte sobre tu caso, el diagnóstico o mis servicios.
            </span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "submitting" ? "Enviando…" : "Enviar mi caso"}
            </button>
            {status === "success" && (
              <p className="text-sm text-foreground" role="status">
                Gracias. Recibí tus datos y revisaré tu caso.
              </p>
            )}
            {status === "error" && errorMsg && (
              <p className="text-sm text-destructive" role="alert">
                {errorMsg}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
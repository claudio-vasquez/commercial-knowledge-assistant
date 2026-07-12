import { DIAGNOSTIC_MAILTO } from "@/lib/contact";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="h-2 w-2 rounded-full bg-foreground" aria-hidden />
          Claudio Vásquez
        </a>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#metodologia" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Metodología
          </a>
          <a href="#asistente" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Asistente
          </a>
        </div>
        <a
          href={DIAGNOSTIC_MAILTO}
          className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Diagnóstico Express
        </a>
      </nav>
    </header>
  );
}
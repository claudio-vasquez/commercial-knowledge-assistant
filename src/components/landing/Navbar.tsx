import { NAV } from "@/lib/navigation";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href={NAV.top.href} className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="h-2 w-2 rounded-full bg-foreground" aria-hidden />
          {NAV.top.label}
        </a>
        <div className="hidden items-center gap-8 md:flex">
          <a href={NAV.metodologia.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {NAV.metodologia.label}
          </a>
          <a href={NAV.asistente.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {NAV.asistente.label}
          </a>
          <a href={NAV.hablemos.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {NAV.hablemos.label}
          </a>
        </div>
        <a
          href={NAV.diagnostico.href}
          className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {NAV.diagnostico.label}
        </a>
      </nav>
    </header>
  );
}
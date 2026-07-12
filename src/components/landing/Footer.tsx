import { CONTACT_EMAIL } from "@/lib/contact";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <p>© {new Date().getFullYear()} Claudio Vásquez. Todos los derechos reservados.</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-foreground">
          {CONTACT_EMAIL}
        </a>
      </div>
    </footer>
  );
}
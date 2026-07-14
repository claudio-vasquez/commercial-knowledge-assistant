import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Methodology } from "@/components/landing/Methodology";
import { AssistantSection } from "@/components/landing/AssistantSection";
import { LeadSection } from "@/components/landing/LeadSection";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Navbar />
      <main>
        <Hero />
        <Methodology />
        <AssistantSection />
        <LeadSection />
      </main>
      <Footer />
    </div>
  );
}
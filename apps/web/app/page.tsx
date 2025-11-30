import { Navbar } from "./components/landing/Navbar";
import { Hero } from "./components/landing/Hero";
import { Features } from "./components/landing/Features";
import { HowItWorks } from "./components/landing/HowItWorks";
import { CTA } from "./components/landing/CTA";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-mocha-crust antialiased">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
    </main>
  );
}

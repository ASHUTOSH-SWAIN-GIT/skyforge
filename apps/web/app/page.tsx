import { Navbar } from "./components/landing/Navbar";
import { Hero } from "./components/landing/Hero";
import { Features } from "./components/landing/Features";
import { Footer } from "./components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-mocha-base">
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </main>
  );
}


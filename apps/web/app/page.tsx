import { Navbar } from "./components/landing/Navbar";
import { Hero } from "./components/landing/Hero";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-mocha-crust antialiased">
      <Navbar />
      <Hero />
    </main>
  );
}

import Link from 'next/link';
import { ArrowRight, Star, Github } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-32 bg-mocha-base relative overflow-hidden">
      {/* Minimal Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-mocha-base to-mocha-crust/50" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-mocha-text tracking-tight">
            Ready to design your next database?
          </h2>

          <p className="text-lg text-mocha-subtext0 mb-10 max-w-xl mx-auto font-light">
            Build better databases faster with Skyforge. Open source and free to get started.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/login">
              <button className="px-8 py-3.5 rounded-xl font-semibold text-mocha-base bg-mocha-text hover:bg-mocha-text/90 transition-colors flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="https://github.com/ASHUTOSH-SWAIN-GIT/skyforge" target="_blank">
              <button className="px-8 py-3.5 rounded-xl font-semibold text-mocha-text bg-mocha-surface0 hover:bg-mocha-surface1 transition-colors flex items-center gap-2">
                <Github className="w-4 h-4" />
                Star on GitHub
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}


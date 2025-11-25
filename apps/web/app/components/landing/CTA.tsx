'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-32 bg-mocha-base relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-mocha-mauve/20 via-mocha-blue/10 to-mocha-mauve/20 rounded-full blur-[128px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Rating */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mocha-surface0/50 border border-mocha-surface1 mb-8">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-mocha-yellow text-mocha-yellow" />
              ))}
            </div>
            <span className="text-sm text-mocha-subtext0">Loved by 10,000+ developers</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-mocha-text">
            Ready to design
            <br />
            <span className="bg-gradient-to-r from-mocha-mauve via-mocha-pink to-mocha-blue bg-clip-text text-transparent">
              your next database?
            </span>
          </h2>

          <p className="text-xl text-mocha-subtext0 mb-10 max-w-2xl mx-auto">
            Join thousands of developers who are building better databases faster with Skyforge.
            Start for free, no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <button className="group relative px-8 py-4 rounded-xl font-semibold text-mocha-crust overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-mocha-mauve/25">
                <div className="absolute inset-0 bg-gradient-to-r from-mocha-mauve via-mocha-pink to-mocha-mauve bg-[length:200%_100%] animate-gradient-x" />
                <span className="relative flex items-center gap-2">
                  Get Started for Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
            <Link href="https://github.com/lowkeydev/skyforge" target="_blank">
              <button className="px-8 py-4 rounded-xl font-semibold text-mocha-text bg-mocha-surface0/50 border border-mocha-surface1 hover:bg-mocha-surface0 transition-all">
                View on GitHub
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { value: '10K+', label: 'Developers' },
              { value: '50K+', label: 'Schemas Created' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold text-mocha-text mb-1">{stat.value}</div>
                <div className="text-sm text-mocha-overlay0">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}


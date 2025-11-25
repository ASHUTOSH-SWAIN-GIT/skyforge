'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, Database, Layers, Link as LinkIcon } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-mocha-crust">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#313244_1px,transparent_1px),linear-gradient(to_bottom,#313244_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-mocha-mauve/30 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-mocha-blue/20 rounded-full blur-[128px] animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mocha-sapphire/10 rounded-full blur-[128px]" />

      <LazyMotion features={domAnimation}>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          {/* Badge */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mocha-surface0/30 border border-mocha-surface1/50 backdrop-blur-sm mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mocha-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-mocha-green" />
            </span>
            <span className="text-sm font-medium text-mocha-subtext1">Introducing Skyforge v1.0</span>
            <ArrowRight className="w-4 h-4 text-mocha-overlay0" />
          </m.div>

          {/* Main Headline */}
          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-mocha-text">Design databases</span>
            <br />
            <span className="bg-gradient-to-r from-mocha-mauve via-mocha-pink to-mocha-blue bg-clip-text text-transparent">
              visually, ship faster
            </span>
          </m.h1>

          {/* Subheadline */}
          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-mocha-subtext0 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The modern database design tool. Build schemas visually, 
            collaborate in real-time, and export production-ready SQL instantly.
          </m.p>

          {/* CTA Buttons */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href="/login">
              <button className="group relative px-8 py-4 rounded-xl font-semibold text-mocha-crust overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-mocha-mauve/25">
                <div className="absolute inset-0 bg-gradient-to-r from-mocha-mauve via-mocha-pink to-mocha-mauve bg-[length:200%_100%] animate-gradient-x" />
                <span className="relative flex items-center gap-2">
                  Start Building Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
            <button className="group flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-mocha-text bg-mocha-surface0/50 border border-mocha-surface1 backdrop-blur-sm hover:bg-mocha-surface0 transition-all">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-mocha-surface1 group-hover:bg-mocha-mauve group-hover:text-mocha-crust transition-colors">
                <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
              </div>
              Watch Demo
            </button>
          </m.div>

          {/* Interactive Schema Preview */}
          <m.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative max-w-5xl mx-auto"
          >
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-mocha-mauve/20 via-mocha-blue/20 to-mocha-mauve/20 rounded-3xl blur-2xl opacity-50" />
            
            {/* Browser Frame */}
            <div className="relative rounded-2xl border border-mocha-surface0 bg-mocha-mantle/80 backdrop-blur-xl shadow-2xl shadow-mocha-crust/50 overflow-hidden">
              {/* Browser Header */}
              <div className="h-12 border-b border-mocha-surface0 flex items-center px-4 gap-4 bg-mocha-crust/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-mocha-red/80" />
                  <div className="w-3 h-3 rounded-full bg-mocha-yellow/80" />
                  <div className="w-3 h-3 rounded-full bg-mocha-green/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1.5 bg-mocha-surface0/50 rounded-lg text-xs text-mocha-overlay0 font-mono">
                    app.skyforge.dev/schema
                  </div>
                </div>
              </div>

              {/* Canvas Content */}
              <div className="relative h-[400px] sm:h-[500px] bg-mocha-base p-8 overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#313244_1px,transparent_1px),linear-gradient(to_bottom,#313244_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />

                {/* Table Nodes */}
                <m.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="absolute left-[10%] top-[15%] w-56 p-4 rounded-xl bg-mocha-mantle/90 border border-mocha-surface0 shadow-xl backdrop-blur-sm hover:border-mocha-blue/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-4 text-mocha-blue font-bold text-sm">
                    <Database className="w-4 h-4" />
                    users
                    <span className="ml-auto text-[10px] px-2 py-0.5 bg-mocha-blue/20 text-mocha-blue rounded-full">PK</span>
                  </div>
                  <div className="space-y-2 text-xs text-mocha-subtext0 font-mono">
                    <div className="flex items-center gap-2 p-2 bg-mocha-surface0/30 rounded-lg">
                      <span className="text-mocha-mauve">id</span>
                      <span className="text-mocha-overlay0">uuid</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-mocha-surface0/30 rounded-lg">
                      <span className="text-mocha-text">email</span>
                      <span className="text-mocha-overlay0">text</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-mocha-surface0/30 rounded-lg">
                      <span className="text-mocha-text">name</span>
                      <span className="text-mocha-overlay0">text</span>
                    </div>
                  </div>
                </m.div>

                <m.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1 }}
                  className="absolute right-[10%] top-[10%] w-56 p-4 rounded-xl bg-mocha-mantle/90 border border-mocha-surface0 shadow-xl backdrop-blur-sm hover:border-mocha-mauve/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-4 text-mocha-mauve font-bold text-sm">
                    <Layers className="w-4 h-4" />
                    projects
                    <span className="ml-auto text-[10px] px-2 py-0.5 bg-mocha-mauve/20 text-mocha-mauve rounded-full">FK</span>
                  </div>
                  <div className="space-y-2 text-xs text-mocha-subtext0 font-mono">
                    <div className="flex items-center gap-2 p-2 bg-mocha-surface0/30 rounded-lg">
                      <span className="text-mocha-mauve">id</span>
                      <span className="text-mocha-overlay0">uuid</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-mocha-surface0/30 rounded-lg">
                      <span className="text-mocha-blue">user_id</span>
                      <span className="text-mocha-overlay0">uuid</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-mocha-surface0/30 rounded-lg">
                      <span className="text-mocha-text">name</span>
                      <span className="text-mocha-overlay0">text</span>
                    </div>
                  </div>
                </m.div>

                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="absolute left-[35%] bottom-[15%] w-56 p-4 rounded-xl bg-mocha-mantle/90 border border-mocha-surface0 shadow-xl backdrop-blur-sm hover:border-mocha-green/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-4 text-mocha-green font-bold text-sm">
                    <LinkIcon className="w-4 h-4" />
                    collaborators
                  </div>
                  <div className="space-y-2 text-xs text-mocha-subtext0 font-mono">
                    <div className="flex items-center gap-2 p-2 bg-mocha-surface0/30 rounded-lg">
                      <span className="text-mocha-mauve">project_id</span>
                      <span className="text-mocha-overlay0">uuid</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-mocha-surface0/30 rounded-lg">
                      <span className="text-mocha-blue">user_id</span>
                      <span className="text-mocha-overlay0">uuid</span>
                    </div>
                  </div>
                </m.div>

                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#89b4fa" />
                      <stop offset="100%" stopColor="#cba6f7" />
                    </linearGradient>
                    <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#cba6f7" />
                      <stop offset="100%" stopColor="#a6e3a1" />
                    </linearGradient>
                  </defs>
                  <m.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 1.4 }}
                    d="M 280 120 C 380 120 420 80 520 80"
                    stroke="url(#lineGradient1)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <m.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 1.6 }}
                    d="M 520 180 C 480 280 420 320 380 320"
                    stroke="url(#lineGradient2)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <m.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 1.8 }}
                    d="M 280 180 C 300 280 340 320 380 320"
                    stroke="url(#lineGradient1)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </m.div>

          {/* Trust Badges */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-16 flex flex-col items-center gap-4"
          >
            <p className="text-sm text-mocha-overlay0">Trusted by developers at</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
              {['Vercel', 'Supabase', 'Railway', 'PlanetScale', 'Neon'].map((company) => (
                <span key={company} className="text-mocha-subtext0 font-semibold text-lg">
                  {company}
                </span>
              ))}
            </div>
          </m.div>
        </div>
      </div>
      </LazyMotion>
    </section>
  );
}

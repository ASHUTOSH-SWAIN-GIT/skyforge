'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, Database, Layers, Github } from 'lucide-react';
import { useUser } from '../../../hooks/useUser';

export function Hero() {
  const { user, isLoading } = useUser();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-mocha-crust">

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-mocha-mauve/30 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-mocha-blue/20 rounded-full blur-[128px] animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mocha-sapphire/10 rounded-full blur-[128px]" />

      <LazyMotion features={domAnimation}>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          {/* GitHub Star Badge */}
          <Link href="https://github.com/ASHUTOSH-SWAIN-GIT/skyforge" target="_blank">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mocha-surface0/30 border border-mocha-surface1/50 backdrop-blur-sm mb-8 hover:bg-mocha-surface0/50 transition-colors cursor-pointer group"
            >
              <Github className="w-4 h-4 text-mocha-text group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-mocha-subtext1 group-hover:text-mocha-text transition-colors">Star us on GitHub</span>
              <div className="flex items-center gap-1 pl-2 border-l border-mocha-surface1/50 ml-1">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-mocha-yellow opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-mocha-yellow" />
                </span>
              </div>
            </m.div>
          </Link>

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
            {!isLoading && user ? (
              <Link href="/dashboard">
                <button className="group relative px-8 py-4 rounded-xl font-semibold text-mocha-crust overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-mocha-mauve/25">
                  <div className="absolute inset-0 bg-gradient-to-r from-mocha-mauve via-mocha-pink to-mocha-mauve bg-[length:200%_100%] animate-gradient-x" />
                  <span className="relative flex items-center gap-2">
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>
            ) : (
              <>
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
              </>
            )}
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
              <div className="relative h-[400px] sm:h-[500px] bg-mocha-base overflow-hidden">
                {/* Grid Pattern Background */}
                <div 
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #cdd6f4 1px, transparent 1px),
                      linear-gradient(to bottom, #cdd6f4 1px, transparent 1px)
                    `,
                    backgroundSize: '24px 24px'
                  }}
                />

                {/* Table: Users - Top Left */}
                <m.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="absolute left-[5%] sm:left-[8%] top-[12%] w-[180px] sm:w-[200px] rounded-xl bg-mocha-mantle border border-mocha-surface0 shadow-2xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-mocha-surface0 bg-mocha-crust/50">
                    <div className="flex items-center gap-2 text-mocha-blue font-semibold text-xs sm:text-sm">
                      <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      users
                    </div>
                    <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 bg-mocha-blue/20 text-mocha-blue rounded-full font-medium">PK</span>
                  </div>
                  <div className="p-2 sm:p-3 space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs font-mono">
                    <div className="flex items-center justify-between p-1.5 sm:p-2 bg-mocha-blue/10 rounded-lg border border-mocha-blue/20">
                      <span className="text-mocha-blue font-medium">id</span>
                      <span className="text-mocha-overlay0">uuid</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg">
                      <span className="text-mocha-subtext1">email</span>
                      <span className="text-mocha-overlay0">text</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg">
                      <span className="text-mocha-subtext1">name</span>
                      <span className="text-mocha-overlay0">text</span>
                    </div>
                  </div>
                </m.div>

                {/* Table: Projects - Top Right */}
                <m.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="absolute right-[5%] sm:right-[8%] top-[5%] w-[180px] sm:w-[200px] rounded-xl bg-mocha-mantle border border-mocha-surface0 shadow-2xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-mocha-surface0 bg-mocha-crust/50">
                    <div className="flex items-center gap-2 text-mocha-mauve font-semibold text-xs sm:text-sm">
                      <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      projects
                    </div>
                    <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 bg-mocha-mauve/20 text-mocha-mauve rounded-full font-medium">FK</span>
                  </div>
                  <div className="p-2 sm:p-3 space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs font-mono">
                    <div className="flex items-center justify-between p-1.5 sm:p-2 bg-mocha-mauve/10 rounded-lg border border-mocha-mauve/20">
                      <span className="text-mocha-mauve font-medium">id</span>
                      <span className="text-mocha-overlay0">uuid</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 sm:p-2 bg-mocha-blue/10 rounded-lg border border-mocha-blue/20">
                      <span className="text-mocha-blue font-medium">user_id</span>
                      <span className="text-mocha-overlay0">uuid</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg">
                      <span className="text-mocha-subtext1">name</span>
                      <span className="text-mocha-overlay0">text</span>
                    </div>
                  </div>
                </m.div>

                {/* Table: Posts - Bottom Center */}
                <m.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                  className="absolute left-1/2 -translate-x-1/2 bottom-[8%] sm:bottom-[10%] w-[180px] sm:w-[200px] rounded-xl bg-mocha-mantle border border-mocha-surface0 shadow-2xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-mocha-surface0 bg-mocha-crust/50">
                    <div className="flex items-center gap-2 text-mocha-green font-semibold text-xs sm:text-sm">
                      <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      posts
                    </div>
                    <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 bg-mocha-green/20 text-mocha-green rounded-full font-medium">FK</span>
                  </div>
                  <div className="p-2 sm:p-3 space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs font-mono">
                    <div className="flex items-center justify-between p-1.5 sm:p-2 bg-mocha-green/10 rounded-lg border border-mocha-green/20">
                      <span className="text-mocha-green font-medium">id</span>
                      <span className="text-mocha-overlay0">uuid</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 sm:p-2 bg-mocha-mauve/10 rounded-lg border border-mocha-mauve/20">
                      <span className="text-mocha-mauve font-medium">project_id</span>
                      <span className="text-mocha-overlay0">uuid</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg">
                      <span className="text-mocha-subtext1">title</span>
                      <span className="text-mocha-overlay0">text</span>
                    </div>
                  </div>
                </m.div>
              </div>
            </div>
          </m.div>
          </div>
      </div>
      </LazyMotion>
    </section>
  );
}

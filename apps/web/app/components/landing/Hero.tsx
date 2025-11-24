'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Database, Layers, Zap } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-mocha-base">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-mocha-mauve/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-mocha-blue/20 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-mocha-surface0/50 border border-mocha-surface1 text-mocha-mauve mb-8 backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-mocha-mauve mr-2 animate-pulse" />
            <span className="text-sm font-medium">Now in Public Beta</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-mocha-text"
          >
            Design Databases with <br />
            <span className="text-mocha-mauve relative inline-block">
              Superpowers
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-mocha-mauve/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-mocha-subtext0 mb-12 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Visual schema design, real-time collaboration, and instant code generation. 
            Skyforge bridges the gap between design and deployment.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/login">
              <button className="w-full sm:w-auto px-8 py-4 bg-mocha-mauve text-mocha-base rounded-xl font-bold text-lg hover:bg-mocha-mauve/90 transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-xl shadow-mocha-mauve/20">
                Start Building Free
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="#features">
              <button className="w-full sm:w-auto px-8 py-4 bg-mocha-surface0 text-mocha-text border border-mocha-surface1 rounded-xl font-bold text-lg hover:bg-mocha-surface1 transition-all hover:scale-105">
                View Demo
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Abstract UI Representation */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-mocha-base via-transparent to-transparent z-10 h-full w-full pointer-events-none" />
          <div className="relative rounded-2xl border border-mocha-surface0 bg-mocha-mantle/50 backdrop-blur-sm p-2 shadow-2xl shadow-mocha-crust/50">
            <div className="bg-mocha-base rounded-xl border border-mocha-surface0 overflow-hidden h-64 md:h-96 relative">
               {/* Fake UI Header */}
               <div className="h-10 border-b border-mocha-surface0 flex items-center px-4 gap-2 bg-mocha-mantle/50">
                 <div className="w-3 h-3 rounded-full bg-mocha-red" />
                 <div className="w-3 h-3 rounded-full bg-mocha-yellow" />
                 <div className="w-3 h-3 rounded-full bg-mocha-green" />
               </div>
               {/* Fake Nodes */}
               <div className="absolute top-1/4 left-1/4 p-4 rounded-xl bg-mocha-mantle border border-mocha-surface0 shadow-lg w-48 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-2 mb-3 text-mocha-blue font-bold text-sm">
                    <Database className="w-4 h-4" /> users
                  </div>
                  <div className="space-y-2 opacity-50">
                    <div className="h-2 w-full bg-mocha-surface1 rounded-full" />
                    <div className="h-2 w-2/3 bg-mocha-surface1 rounded-full" />
                  </div>
               </div>
               <div className="absolute top-1/3 right-1/3 p-4 rounded-xl bg-mocha-mantle border border-mocha-surface0 shadow-lg w-48 transform rotate-3 hover:rotate-0 transition-transform duration-500 z-10">
                  <div className="flex items-center gap-2 mb-3 text-mocha-mauve font-bold text-sm">
                    <Layers className="w-4 h-4" /> projects
                  </div>
                  <div className="space-y-2 opacity-50">
                    <div className="h-2 w-full bg-mocha-surface1 rounded-full" />
                    <div className="h-2 w-3/4 bg-mocha-surface1 rounded-full" />
                    <div className="h-2 w-1/2 bg-mocha-surface1 rounded-full" />
                  </div>
               </div>
                {/* Connection Line (Fake) */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none">
                 <path d="M 350 180 C 450 180, 450 220, 550 220" stroke="#cba6f7" strokeWidth="2" strokeDasharray="5,5" fill="none" className="opacity-50" />
               </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


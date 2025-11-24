'use client';

import { motion } from 'framer-motion';
import { Code2, Users, Workflow, Shield, Zap, Globe } from 'lucide-react';

const features = [
  {
    icon: <Workflow className="w-6 h-6" />,
    title: 'Visual Schema Builder',
    description: 'Drag, drop, and connect tables. Design complex relationships intuitively without writing a single line of SQL.',
    color: 'text-mocha-blue',
    bg: 'bg-mocha-blue/10',
  },
  {
    icon: <Code2 className="w-6 h-6" />,
    title: 'Instant Code Gen',
    description: 'Export your schema to SQL, Prisma, Go structs, or TypeScript interfaces instantly. Always sync, never stale.',
    color: 'text-mocha-mauve',
    bg: 'bg-mocha-mauve/10',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Real-time Collaboration',
    description: 'Work with your team in real-time. See cursors, comments, and changes as they happen. Multiplayer by default.',
    color: 'text-mocha-green',
    bg: 'bg-mocha-green/10',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Type Safe',
    description: 'Built-in validation ensures your schema is correct. Catch errors before they hit production.',
    color: 'text-mocha-peach',
    bg: 'bg-mocha-peach/10',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Lightning Fast',
    description: 'Built on modern tech stack for blazing fast performance, even with massive schemas.',
    color: 'text-mocha-yellow',
    bg: 'bg-mocha-yellow/10',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Cloud Native',
    description: 'Access your schemas from anywhere. Version control integration and cloud backups included.',
    color: 'text-mocha-sapphire',
    bg: 'bg-mocha-sapphire/10',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-mocha-base relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mocha-surface0 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-6 text-mocha-text"
          >
            Everything you need to build <br />
            <span className="text-mocha-mauve">world-class databases</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-mocha-subtext0 text-lg"
          >
            From solo developers to enterprise teams, Skyforge provides the tools to design, document, and deploy better database schemas.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-2xl bg-mocha-mantle border border-mocha-surface0 hover:border-mocha-mauve/50 transition-all hover:bg-mocha-mantle/80 group shadow-lg hover:shadow-mocha-mauve/5"
            >
              <div className={`w-12 h-12 rounded-lg ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-mocha-text mb-3">{feature.title}</h3>
              <p className="text-mocha-subtext0 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


import { Code2, Users, Workflow, Shield, Zap, Sparkles, Database } from 'lucide-react';

const features = [
  {
    icon: <Workflow className="w-5 h-5" />,
    title: 'Visual Schema Builder',
    description: 'Design complex database schemas with an intuitive drag-and-drop interface.',
    color: 'text-mocha-blue',
    bg: 'bg-mocha-blue/10',
    border: 'hover:border-mocha-blue/50'
  },
  {
    icon: <Code2 className="w-5 h-5" />,
    title: 'Instant Code Generation',
    description: 'Export your schema to production-ready SQL, Prisma, or TypeORM instantly.',
    color: 'text-mocha-mauve',
    bg: 'bg-mocha-mauve/10',
    border: 'hover:border-mocha-mauve/50'
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Real-time Collaboration',
    description: 'Work together with your team in real-time with live cursors and comments.',
    color: 'text-mocha-green',
    bg: 'bg-mocha-green/10',
    border: 'hover:border-mocha-green/50'
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'AI-Powered Assistant',
    description: 'Let AI help you design schemas and generate SQL from natural language.',
    color: 'text-mocha-pink',
    bg: 'bg-mocha-pink/10',
    border: 'hover:border-mocha-pink/50'
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Lightning Performance',
    description: 'Built for instant responsiveness, even with thousands of tables.',
    color: 'text-mocha-yellow',
    bg: 'bg-mocha-yellow/10',
    border: 'hover:border-mocha-yellow/50'
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with end-to-end encryption. Your data is safe.',
    color: 'text-mocha-lavender',
    bg: 'bg-mocha-lavender/10',
    border: 'hover:border-mocha-lavender/50'
  },
];

export function Features() {
  return (
    <section id="features" className="py-32 bg-mocha-base relative overflow-hidden">
      {/* Minimal Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(#cdd6f4 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Minimal Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-mocha-text tracking-tight">
            Everything you need to build
            <span className="block text-mocha-mauve mt-2">better databases</span>
          </h2>
          <p className="text-lg text-mocha-overlay0 font-light">
            Powerful tools for modern development teams.
          </p>
        </div>

        {/* Clean Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group p-6 rounded-2xl bg-mocha-mantle/50 border border-mocha-surface0 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${feature.border}`}
            >
              <div className="flex flex-col h-full">
                <div className={`w-10 h-10 rounded-lg ${feature.bg} ${feature.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-lg font-semibold text-mocha-text mb-2 group-hover:text-mocha-text/90">
                  {feature.title}
                </h3>
                
                <p className="text-sm text-mocha-subtext0 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

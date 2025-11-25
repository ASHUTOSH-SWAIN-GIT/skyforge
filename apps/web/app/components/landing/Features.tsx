import { Code2, Users, Workflow, Shield, Zap, Sparkles, Database } from 'lucide-react';

const features = [
  {
    icon: <Workflow className="w-6 h-6" />,
    title: 'Visual Schema Builder',
    description: 'Design complex database schemas with an intuitive drag-and-drop interface. No SQL knowledge required.',
    gradient: 'from-mocha-blue to-mocha-sapphire',
  },
  {
    icon: <Code2 className="w-6 h-6" />,
    title: 'Instant Code Generation',
    description: 'Export your schema to production-ready SQL, Prisma, TypeORM, or any other format with one click.',
    gradient: 'from-mocha-mauve to-mocha-pink',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Real-time Collaboration',
    description: 'Work together with your team in real-time. See changes, cursors, and comments as they happen.',
    gradient: 'from-mocha-green to-mocha-teal',
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'AI-Powered Assistant',
    description: 'Let AI help you design schemas, suggest optimizations, and generate SQL from natural language.',
    gradient: 'from-mocha-pink to-mocha-red',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Lightning Performance',
    description: 'Built on cutting-edge technology for instant responsiveness, even with thousands of tables.',
    gradient: 'from-mocha-yellow to-mocha-peach',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with end-to-end encryption. Your data never leaves your control.',
    gradient: 'from-mocha-lavender to-mocha-blue',
  },
];

export function Features() {
  return (
    <section id="features" className="py-32 bg-mocha-base relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mocha-surface1 to-transparent" />
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-mocha-mauve/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-mocha-blue/5 rounded-full blur-[128px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mocha-surface0/50 border border-mocha-surface1 mb-6">
            <Database className="w-4 h-4 text-mocha-mauve" />
            <span className="text-sm font-medium text-mocha-subtext1">Powerful Features</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-mocha-text">
            Everything you need to
            <br />
            <span className="bg-gradient-to-r from-mocha-mauve to-mocha-blue bg-clip-text text-transparent">
              build better databases
            </span>
          </h2>
          
          <p className="text-lg text-mocha-subtext0">
            From solo developers to enterprise teams, Skyforge provides the complete 
            toolkit for designing, documenting, and deploying database schemas.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-2xl bg-mocha-mantle/50 border border-mocha-surface0 hover:border-mocha-surface1 transition-all duration-500 hover:shadow-xl hover:shadow-mocha-crust/20 will-change-transform"
            >
              {/* Hover Gradient */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-[1px] mb-6`}>
                <div className="w-full h-full rounded-xl bg-mocha-mantle flex items-center justify-center text-mocha-text group-hover:bg-transparent group-hover:text-mocha-crust transition-colors duration-300">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-mocha-text mb-3 group-hover:text-mocha-mauve transition-colors">
                {feature.title}
              </h3>
              <p className="text-mocha-subtext0 leading-relaxed">
                {feature.description}
              </p>

              {/* Arrow */}
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-mocha-overlay0 group-hover:text-mocha-mauve transition-colors">
                Learn more
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

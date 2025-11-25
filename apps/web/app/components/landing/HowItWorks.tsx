import { MousePointer2, Layers, Code, Rocket } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: <MousePointer2 className="w-6 h-6" />,
    title: 'Design Visually',
    description: 'Start with a blank canvas or import an existing schema. Add tables, define columns, and create relationships by drawing connections.',
  },
  {
    number: '02',
    icon: <Layers className="w-6 h-6" />,
    title: 'Collaborate',
    description: 'Invite your team to collaborate in real-time. Review changes, leave comments, and iterate together on your schema design.',
  },
  {
    number: '03',
    icon: <Code className="w-6 h-6" />,
    title: 'Generate Code',
    description: 'Export your schema to SQL, Prisma, TypeORM, or any other format. Copy, download, or push directly to your repository.',
  },
  {
    number: '04',
    icon: <Rocket className="w-6 h-6" />,
    title: 'Deploy',
    description: 'Run migrations directly from Skyforge or integrate with your CI/CD pipeline for automated deployments.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 bg-mocha-crust relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mocha-surface1 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mocha-surface1 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-mocha-text">
            From idea to production
            <br />
            <span className="bg-gradient-to-r from-mocha-green to-mocha-teal bg-clip-text text-transparent">
              in minutes, not days
            </span>
          </h2>
          <p className="text-lg text-mocha-subtext0">
            Skyforge streamlines your entire database design workflow
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative will-change-transform"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gradient-to-r from-mocha-surface1 to-transparent" />
              )}

              {/* Card */}
              <div className="relative p-6 rounded-2xl bg-mocha-mantle/50 border border-mocha-surface0 hover:border-mocha-surface1 transition-all group">
                {/* Number Badge */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-lg bg-gradient-to-br from-mocha-mauve to-mocha-blue flex items-center justify-center text-xs font-bold text-mocha-crust">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-mocha-surface0 flex items-center justify-center text-mocha-mauve mb-4 group-hover:bg-mocha-mauve group-hover:text-mocha-crust transition-colors">
                  {step.icon}
                </div>

                <h3 className="text-lg font-bold text-mocha-text mb-2">{step.title}</h3>
                <p className="text-sm text-mocha-subtext0 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


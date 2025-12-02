import { MousePointer2, Layers, Code, Rocket } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: <MousePointer2 className="w-5 h-5" />,
    title: 'Design Visually',
    description: 'Draw your schema on an infinite canvas. Add tables and relationships intuitively.',
    color: 'text-mocha-blue',
    bg: 'bg-mocha-blue/10'
  },
  {
    number: '02',
    icon: <Layers className="w-5 h-5" />,
    title: 'Collaborate',
    description: 'Invite your team and design together in real-time with live updates.',
    color: 'text-mocha-mauve',
    bg: 'bg-mocha-mauve/10'
  },
  {
    number: '03',
    icon: <Code className="w-5 h-5" />,
    title: 'Generate Code',
    description: 'Get production-ready SQL or ORM schemas instantly.',
    color: 'text-mocha-green',
    bg: 'bg-mocha-green/10'
  },
  {
    number: '04',
    icon: <Rocket className="w-5 h-5" />,
    title: 'Ship Faster',
    description: 'Deploy your database changes with confidence and speed.',
    color: 'text-mocha-pink',
    bg: 'bg-mocha-pink/10'
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 bg-mocha-crust relative overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#cdd6f4 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-24">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-mocha-text tracking-tight">
            From idea to production
            <span className="block text-mocha-blue mt-2">in record time</span>
          </h2>
          <p className="text-lg text-mocha-overlay0 font-light">
            A streamlined workflow for modern database design.
          </p>
        </div>

        {/* Steps Timeline */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-mocha-surface0 -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
                className="relative group bg-mocha-mantle p-6 rounded-2xl border border-mocha-surface0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Step Number (Timeline Dot) */}
                <div className="hidden lg:flex absolute -top-[3.25rem] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-mocha-base border-4 border-mocha-crust items-center justify-center z-10">
                  <div className={`w-2.5 h-2.5 rounded-full ${step.bg.replace('/10', '')}`} />
                </div>

                {/* Mobile Number */}
                <span className="lg:hidden absolute top-6 right-6 text-4xl font-bold text-mocha-surface0/50 select-none">
                  {step.number}
                </span>

                <div className={`w-12 h-12 rounded-xl ${step.bg} ${step.color} flex items-center justify-center mb-6`}>
                  {step.icon}
                </div>

                <h3 className="text-lg font-bold text-mocha-text mb-3">{step.title}</h3>
                <p className="text-sm text-mocha-subtext0 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
            </div>
        </div>
      </div>
    </section>
  );
}


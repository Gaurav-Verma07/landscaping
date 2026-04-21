'use client';

import { LayoutDashboard, Mic, Zap } from 'lucide-react';

const features = [
  {
    name: 'Run your business from one screen',
    description:
      'Manage projects, track leads, and oversee your entire operation from a single, intuitive dashboard.',
    icon: LayoutDashboard,
  },
  {
    name: 'Voice commands, zero typing',
    description:
      'Use our AI assistant to create notes, schedule appointments, and update job statuses hands-free.',
    icon: Mic,
  },
  {
    name: 'Fast estimates, instant invoices',
    description:
      'Generate professional quotes in seconds and automate your invoicing to get paid faster.',
    icon: Zap,
  },
];

export function ValueProps() {
  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.name}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

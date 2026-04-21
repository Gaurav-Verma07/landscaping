'use client';

import { 
  Bot, 
  Ruler, 
  Calculator, 
  Users, 
  Image as ImageIcon, 
  ShieldCheck 
} from 'lucide-react';

const features = [
  {
    name: 'AI Voice Assistant',
    description: 'Dictate notes, set reminders, and query job details using natural language.',
    icon: Bot,
  },
  {
    name: 'Roof Measurement',
    description: 'Integrate with top measurement tools to import data directly into quotes.',
    icon: Ruler,
  },
  {
    name: 'Material Pricing',
    description: 'Real-time pricing updates from local suppliers to ensure accurate estimates.',
    icon: Calculator,
  },
  {
    name: 'Subcontractor Profiles',
    description: 'Manage crews, track insurance, and assign jobs with ease.',
    icon: Users,
  },
  {
    name: 'Before/After Media',
    description: 'Upload and organize job site photos to document progress and quality.',
    icon: ImageIcon,
  },
  {
    name: 'Multi-role Access',
    description: 'Granular permissions for admins, sales reps, and field crews.',
    icon: ShieldCheck,
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
            Built for the modern roofer
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every tool you need to scale your business, integrated into one powerful platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.name} className="group p-8 rounded-3xl border bg-card text-card-foreground shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight">{feature.name}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

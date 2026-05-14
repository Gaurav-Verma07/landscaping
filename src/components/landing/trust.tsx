'use client';

import { Star } from 'lucide-react';

export function Trust() {
  return (
    <section className="py-24 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-16">
          Trusted by contractors across 15 states
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              quote: "Landscaping has completely transformed how we handle our operations. The automation alone saved us 20 hours a week.",
              author: "Mike Thompson",
              role: "Owner, Apex Roofing",
              stars: 5
            },
            {
              quote: "The best CRM for landscaping, period. The mobile app makes it easy for my crews to stay updated in the field.",
              author: "Sarah Jenkins",
              role: "Operations Mgr, Skyline Construction",
              stars: 5
            },
            {
              quote: "We doubled our closing rate using the AI estimates. It pays for itself ten times over every month.",
              author: "David Chen",
              role: "Sales Director, Elite Exteriors",
              stars: 5
            }
          ].map((testimonial, i) => (
            <div key={i} className="bg-background rounded-2xl p-8 shadow-sm border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
              <div className="flex justify-center mb-6 text-yellow-400">
                {[...Array(testimonial.stars)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-lg text-muted-foreground mb-8 italic flex-1 leading-relaxed">
                &quot;{testimonial.quote}&quot;
              </p>

              <div>
                <div className="font-bold text-lg">{testimonial.author}</div>
                <div className="text-sm text-muted-foreground font-medium">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Placeholder for Logos */}
        <div className="mt-24 pt-12 border-t border-border/50">
          <p className="text-sm font-bold tracking-widest text-muted-foreground mb-8 uppercase">Integrates with</p>
          <div className="flex flex-wrap justify-center gap-10 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="text-2xl font-bold hover:text-primary transition-colors cursor-default">QuickBooks</div>
             <div className="text-2xl font-bold hover:text-primary transition-colors cursor-default">EagleView</div>
             <div className="text-2xl font-bold hover:text-primary transition-colors cursor-default">CompanyCam</div>
             <div className="text-2xl font-bold hover:text-primary transition-colors cursor-default">Zapier</div>
          </div>
        </div>
      </div>
    </section>
  );
}

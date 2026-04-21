'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CTAFooter() {
  return (
    <section className="py-32 bg-primary text-primary-foreground text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-8 leading-tight">
          Bring your roofing business <br className="hidden sm:inline" /> into the future.
        </h2>
        <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto mb-12 leading-relaxed">
          Join the beta today and start saving time on every job.
        </p>
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <Button size="lg" variant="secondary" className="h-16 px-10 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105" asChild>
            <Link href="/auth/signup">Join the Beta</Link>
          </Button>
          <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-full bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-all" asChild>
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
        
        <div className="mt-24 pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/70">
          <div>© 2026 Landscaping. All rights reserved.</div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

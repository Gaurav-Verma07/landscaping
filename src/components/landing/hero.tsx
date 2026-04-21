'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function Hero() {
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-10 relative z-10">
        <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
          New: AI-Powered Estimates 2.0
        </Badge>
        
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl max-w-6xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 leading-[1.1]">
          The Roofing Operating System <br className="hidden sm:inline" />
          <span className="text-foreground">Built for Growth.</span>
        </h1>
        
        <p className="mx-auto max-w-[800px] text-muted-foreground text-xl md:text-2xl leading-relaxed">
          Streamline your entire roofing business from lead to paid. 
          Automate estimates, manage crews, and track profitability in one place.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto pt-6">
          <Button size="lg" className="h-14 px-10 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all rounded-full" asChild>
            <Link href="/auth/signup">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-10 text-lg backdrop-blur-sm bg-background/50 border-primary/20 hover:bg-primary/5 rounded-full" asChild>
            <Link href="#">
              <PlayCircle className="mr-2 h-5 w-5" /> Watch Demo
            </Link>
          </Button>
        </div>

        <div className="pt-10 flex items-center justify-center gap-8 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>14-day free trial</span>
          </div>
        </div>
      </div>
    </section>
  )
}

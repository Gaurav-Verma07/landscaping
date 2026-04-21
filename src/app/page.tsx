import { Navbar02 } from '@/components/landing/navbar';
import HeroSection from '@/components/landing/hero-section';
import { ValueProps } from '@/components/landing/value-props';
import { ProductPreview } from '@/components/landing/product-preview';
import { Stormchaser } from '@/components/landing/stormchaser';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { Trust } from '@/components/landing/trust';
import { CTAFooter } from '@/components/landing/cta-footer';
import Image from "next/image";
export default async function Home() {
  const user = null;

  return (
    <div className="relative w-full min-h-screen flex flex-col">
      <Navbar02 
        user={user}
        signInHref="/auth/login"
        ctaHref="/auth/signup"
        logoHref="/"
        logo={
          <div className="flex items-center gap-2">
            <div className="flex aspect-square size-11 items-center justify-center rounded-lg border bg-transparent">
              <Image
                src="/logo-bg.jpeg"
                alt="Landscaping"
                width={44}
                height={44}
                className="size-9 object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-bold tracking-tight font-sans">Landscaping</span>
          </div>
        }
      />
      
      <main className="flex-1">
        <HeroSection />
        <ValueProps />
        <ProductPreview />
        <Stormchaser />
        <FeaturesGrid />
        <Trust />
      </main>

      <CTAFooter />
    </div>
  );
}

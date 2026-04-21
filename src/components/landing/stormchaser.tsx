'use client';

import { CloudLightning, MapPin, DollarSign } from 'lucide-react';
import Image from 'next/image';

export function Stormchaser() {
  return (
    <section className="py-24 sm:py-32 bg-slate-950 text-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/50 px-4 py-1.5 text-sm font-medium text-slate-300 mb-8 backdrop-blur-sm">
              <CloudLightning className="mr-2 h-4 w-4 text-yellow-400" />
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent font-bold">Stormchaser Mode</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6 leading-tight">
              Dominate the <br/> <span className="text-slate-400">storm season.</span>
            </h2>
            <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-lg">
              When the storm hits, speed is everything. Our Stormchaser suite gives you the edge with real-time tracking and automated workflows.
            </p>
            
            <ul className="space-y-8">
              <li className="flex items-start group">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-yellow-400 mr-5 group-hover:border-yellow-400/30 group-hover:bg-yellow-400/10 transition-all duration-300">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-yellow-400 transition-colors">Rep Tracking</h3>
                  <p className="text-slate-500 leading-relaxed">Live GPS tracking of your sales team in affected areas.</p>
                </div>
              </li>
              <li className="flex items-start group">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-green-400 mr-5 group-hover:border-green-400/30 group-hover:bg-green-400/10 transition-all duration-300">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-green-400 transition-colors">10/50 Payout Automation</h3>
                  <p className="text-slate-500 leading-relaxed">Automate commission calculations and payouts instantly.</p>
                </div>
              </li>
              <li className="flex items-start group">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-blue-400 mr-5 group-hover:border-blue-400/30 group-hover:bg-blue-400/10 transition-all duration-300">
                  <CloudLightning className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors">Weather Alerts</h3>
                  <p className="text-slate-500 leading-relaxed">Instant notifications for hail and wind events in your territory.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur opacity-20 animate-pulse" />
            <div className="aspect-square rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group shadow-2xl">
               {/* Map Background Image */}
               <div className="absolute inset-0 opacity-60 mix-blend-luminosity group-hover:opacity-40 transition-opacity duration-700">
                 <Image 
                   src="/storm-map-dark.png" 
                   alt="Storm Map" 
                   fill 
                   className="object-cover"
                 />
               </div>
               
               {/* Radar Overlay */}
               <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/80 via-transparent to-slate-900/20" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(56,189,248,0.1)_360deg)] animate-[spin_8s_linear_infinite] rounded-full" />
               
               {/* Map Pins */}
               {[
                 { top: '30%', left: '40%', color: 'bg-green-500', delay: '0s' },
                 { top: '50%', left: '60%', color: 'bg-blue-500', delay: '1s' },
                 { top: '70%', left: '30%', color: 'bg-yellow-500', delay: '2s' },
                 { top: '45%', left: '20%', color: 'bg-red-500', delay: '1.5s' },
                 { top: '20%', left: '70%', color: 'bg-purple-500', delay: '0.5s' },
               ].map((pin, i) => (
                 <div key={i} className="absolute w-4 h-4" style={{ top: pin.top, left: pin.left }}>
                    <div className={`w-full h-full rounded-full ${pin.color} animate-ping absolute opacity-75`} style={{ animationDelay: pin.delay }} />
                    <div className={`w-full h-full rounded-full ${pin.color} relative border-2 border-slate-900 shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
                 </div>
               ))}

               {/* UI Overlay */}
               <div className="absolute bottom-6 left-6 right-6 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Live Activity</span>
                     <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  </div>
                  <div className="space-y-3">
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">Active Crews</span>
                        <span className="font-mono font-bold text-white">12</span>
                     </div>
                     <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-500 h-1.5 rounded-full w-3/4 animate-[shimmer_2s_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]" />
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">Storm Intensity</span>
                        <span className="font-mono font-bold text-yellow-400 drop-shadow-sm">HIGH</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

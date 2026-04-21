'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Laptop, Smartphone, Zap } from "lucide-react"
import Image from 'next/image'

export function ProductPreview() {
  return (
    <section className="py-24 md:py-32 bg-muted/30 flex items-center justify-center">
      <div className="w-full max-w-6xl px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
          <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Platform Overview
          </div>
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Everything you need to run your business.
          </h2>
          <p className="max-w-[900px] text-muted-foreground text-lg md:text-xl leading-relaxed">
            Switch between views to see how Landscaping handles every aspect of your workflow.
          </p>
        </div>

        <div className="flex justify-center">
          <Tabs defaultValue="crm" className="w-full max-w-5xl">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-md grid-cols-3 h-12 p-1 bg-muted/50 backdrop-blur-sm rounded-full">
                <TabsTrigger value="crm" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">CRM Hub</TabsTrigger>
                <TabsTrigger value="quote" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Quick Quote</TabsTrigger>
                <TabsTrigger value="mobile" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Mobile App</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex justify-center">
              <TabsContent value="crm" className="mt-0 focus-visible:outline-none focus-visible:ring-0 w-full">
                <Card className="border-none shadow-2xl bg-background/50 backdrop-blur-xl overflow-hidden ring-1 ring-white/10">
                  <CardContent className="p-0 aspect-video relative">
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
                     {/* CRM Mockup */}
                     <div className="absolute inset-0 p-8 flex gap-8">
                        <div className="w-64 h-full bg-card/80 backdrop-blur-md border rounded-2xl p-5 hidden md:flex flex-col gap-4 shadow-sm">
                          <div className="h-8 w-full bg-primary/10 rounded-lg mb-2" />
                          <div className="space-y-2">
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className="h-10 w-full hover:bg-muted/50 rounded-lg flex items-center px-3 transition-colors cursor-pointer">
                                <div className="h-4 w-4 bg-muted/40 rounded-full mr-3" />
                                <div className="h-3 w-24 bg-muted/40 rounded-full" />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex-1 h-full flex flex-col gap-6">
                          <div className="grid grid-cols-3 gap-6">
                            {[1,2,3].map(i => (
                              <div key={i} className="h-28 bg-card/80 backdrop-blur-md border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                                <div className="h-4 w-16 bg-muted/40 rounded-full" />
                                <div className="h-8 w-24 bg-primary/20 rounded-lg" />
                              </div>
                            ))}
                          </div>
                          <div className="flex-1 bg-card/80 backdrop-blur-md border rounded-2xl p-6 shadow-sm flex items-end justify-between gap-3">
                             {[30, 50, 40, 60, 80, 70, 90, 60, 50, 70, 80, 95].map((h, i) => (
                                <div key={i} className="w-full bg-primary/30 rounded-t-sm hover:bg-primary/50 transition-colors" style={{ height: `${h}%` }} />
                             ))}
                          </div>
                        </div>
                     </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
            
            <div className="flex justify-center">
              <TabsContent value="quote" className="mt-0 focus-visible:outline-none focus-visible:ring-0 w-full">
                <Card className="border-none shadow-2xl bg-background/50 backdrop-blur-xl overflow-hidden ring-1 ring-white/10">
                  <CardContent className="p-0 aspect-video relative flex items-center justify-center bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5">
                    <div className="absolute inset-0 opacity-80">
                      <Image 
                        src="/product-quote.png" 
                        alt="Quick Quote Interface" 
                        fill 
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
            
            <div className="flex justify-center">
              <TabsContent value="mobile" className="mt-0 focus-visible:outline-none focus-visible:ring-0 w-full">
                <Card className="border-none shadow-2xl bg-background/50 backdrop-blur-xl overflow-hidden ring-1 ring-white/10">
                  <CardContent className="p-0 aspect-video relative flex items-center justify-center bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5">
                     <div className="absolute inset-0 opacity-80">
                       <Image 
                         src="/product-mobile.png" 
                         alt="Mobile App Interface" 
                         fill 
                         className="object-cover"
                       />
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </section>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CloudLightning, MapPin, AlertTriangle } from "lucide-react"

export function WeatherMap() {
  return (
    <Card className="col-span-1 md:col-span-7 lg:col-span-7">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Weather & Alerts Map</CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time weather impact on active job sites
          </p>
        </div>
        <Button variant="destructive" size="sm" className="gap-2">
          <CloudLightning className="h-4 w-4" />
          Storm Mode
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[300px] bg-muted/30 rounded-lg overflow-hidden border flex items-center justify-center group">
          {/* Map Placeholder Background */}
          <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-98.5795,39.8283,3,0/800x400?access_token=placeholder')] bg-cover bg-center opacity-50 grayscale group-hover:grayscale-0 transition-all duration-500" />
          
          {/* Fake Map Grid for visual effect if image fails */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Interactive Elements (Mock) */}
          <div className="relative z-10 grid gap-4 text-center">
            <div className="bg-background/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500/10 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Hail Warning</p>
                  <p className="text-xs text-muted-foreground">Sector 4 (3 Active Jobs)</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
               <div className="flex items-center gap-1 bg-background/80 px-2 py-1 rounded-md text-xs border shadow-sm">
                 <MapPin className="h-3 w-3 text-emerald-500" /> 5 Safe
               </div>
               <div className="flex items-center gap-1 bg-background/80 px-2 py-1 rounded-md text-xs border shadow-sm">
                 <MapPin className="h-3 w-3 text-red-500" /> 2 At Risk
               </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import * as React from "react"
import dynamic from 'next/dynamic'
import { MapPin, Navigation, AlertTriangle, Cloud, CloudRain, Wind } from "lucide-react"
import { Job } from "@/types/schedule.types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

// Dynamically import Leaflet to avoid SSR issues
let L: unknown = null
const getLeaflet = async () => {
  if (!L) {
    const leafletModule = await import('leaflet')
    L = leafletModule.default
  }
  return L as any
}

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'

// Custom CSS for markers
const customMarkerStyles = `
  .custom-marker {
    background: transparent !important;
    border: none !important;
  }
  .custom-marker div {
    pointer-events: none;
  }
`

interface WeatherMapProps {
  jobs: Job[]
  onJobSelect?: (job: Job) => void
  className?: string
}

// Custom marker icon component using Lucide React
const createCustomIcon = async (risk: 'low' | 'medium' | 'high') => {
  const L = await getLeaflet()

  const getIconContent = (riskLevel: string) => {
    const iconColors = {
      low: 'text-green-500',
      medium: 'text-yellow-500',
      high: 'text-red-500'
    }

    const bgColors = {
      low: 'bg-green-100',
      medium: 'bg-yellow-100',
      high: 'bg-red-100'
    }

    return `
      <div class="relative">
        <div class="absolute -inset-1 ${bgColors[riskLevel]} rounded-full opacity-50"></div>
        <div class="relative bg-white border-2 ${iconColors[riskLevel]} border-current rounded-full p-1 shadow-lg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${iconColors[riskLevel]}">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-current ${iconColors[riskLevel]}"></div>
      </div>
    `
  }

  return new L.DivIcon({
    html: getIconContent(risk),
    className: 'custom-marker',
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42]
  })
}

// Job Popup Component
function JobPopup({ job, onClose }: { job: Job, onClose: () => void }) {
  const getWeatherRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-red-500 bg-red-50"
      case "medium":
        return "text-yellow-500 bg-yellow-50"
      case "low":
        return "text-green-500 bg-green-50"
      default:
        return "text-gray-500 bg-gray-50"
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500 bg-green-50"
      case "cancelled":
        return "text-red-500 bg-red-50"
      case "en-route":
        return "text-blue-500 bg-blue-50"
      case "on-site":
        return "text-purple-500 bg-purple-50"
      case "assigned":
        return "text-indigo-500 bg-indigo-50"
      default:
        return "text-gray-500 bg-gray-50"
    }
  }
  
  return (
    <div className="p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{job.title}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          ×
        </Button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Client:</span>
          <span className="font-medium">{job.client}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Location:</span>
          <span className="font-medium">{job.location}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Time:</span>
          <span className="font-medium">{job.startTime} - {job.endTime}</span>
        </div>
        
        {job.crew && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Crew:</span>
            <span className="font-medium">{job.crew}</span>
          </div>
        )}
        
        <div className="flex gap-2">
          <Badge className={cn("text-xs", getStatusColor(job.status))}>
            {job.status}
          </Badge>
          <Badge className={cn("text-xs", getWeatherRiskColor(job.weatherRisk))}>
            {job.weatherRisk} risk
          </Badge>
        </div>
        
        {job.estimatedValue && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Value:</span>
            <span className="font-medium">${job.estimatedValue.toLocaleString()}</span>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-2 border-t">
        <Button size="sm" className="w-full">
          <Navigation className="mr-2 h-3 w-3" />
          Get Directions
        </Button>
      </div>
    </div>
  )
}

export function WeatherMap({
  jobs,
  onJobSelect,
  className
}: WeatherMapProps) {
  const [map, setMap] = React.useState<any>(null)
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null)
  const [customIcons, setCustomIcons] = React.useState<Record<string, any> | null>(null)
  
  // Mock coordinates for jobs (in a real app, these would come from geocoding)
  const jobCoordinates = React.useMemo(() => {
    return jobs.map(job => {
      // Seeded deterministic pseudo-random values
      const seedLat = (job.id.length * 7) % 100 / 1000;
      const seedLng = (job.id.length * 13) % 100 / 1000;
      return {
        ...job,
        lat: 39.7817 + seedLat - 0.05, // Springfield, IL area
        lng: -89.6501 + seedLng - 0.05
      };
    })
  }, [jobs])
  
  // Inject custom CSS and load custom icons
  React.useEffect(() => {
    const setupMap = async () => {
      if (typeof window !== 'undefined') {
        // Inject custom CSS
        if (!document.getElementById('custom-map-styles')) {
          const styleElement = document.createElement('style')
          styleElement.id = 'custom-map-styles'
          styleElement.textContent = customMarkerStyles
          document.head.appendChild(styleElement)
        }

        // Load icons
        const icons = {
          low: await createCustomIcon('low'),
          medium: await createCustomIcon('medium'),
          high: await createCustomIcon('high')
        }
        setCustomIcons(icons)
      }
    }
    setupMap()
  }, [])

  // Initialize map
  React.useEffect(() => {
    if (typeof window !== 'undefined' && map) {
      // Map is ready, no need to set view as it's handled by MapContainer props
      console.log('Map initialized:', map)
    }
  }, [map])
  
  // Handle job selection
  const handleJobSelect = (job: Job) => {
    setSelectedJob(job)
    onJobSelect?.(job)
  }
  
  // Handle map ready
  const handleMapReady = (mapInstance: any) => {
    setMap(mapInstance)
  }
  
  return (
    <Card className={cn("h-full overflow-hidden flex flex-col", className)}>
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Job Locations
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 relative min-h-0">
        <MapContainer
          center={[39.7817, -89.6501]} // Springfield, IL
          zoom={12}
          style={{ height: '100%', width: '100%', minHeight: '400px' }}
          ref={setMap}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {customIcons && jobCoordinates.map(job => (
            <Marker
              key={job.id}
              position={[job.lat, job.lng]}
              icon={customIcons[job.weatherRisk]}
              eventHandlers={{
                click: () => handleJobSelect(job)
              }}
            >
              <Popup>
                <JobPopup
                  job={job}
                  onClose={() => setSelectedJob(null)}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Legend */}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 z-[1000]">
          <h4 className="font-medium text-sm mb-2">Weather Risk</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs">Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-xs">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs">High Risk</span>
            </div>
          </div>
        </div>
        
        {/* Weather Overlay */}
        <div className="absolute top-20 left-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 z-[1000]">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="h-4 w-4" />
            <span className="text-sm font-medium">Current Weather</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span>Temperature:</span>
              <span className="font-medium">72°F</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Condition:</span>
              <span className="font-medium">Partly Cloudy</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-3 w-3" />
              <span>Wind:</span>
              <span className="font-medium">8 mph NW</span>
            </div>
            <div className="flex items-center gap-2">
              <CloudRain className="h-3 w-3" />
              <span>Precipitation:</span>
              <span className="font-medium">0%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

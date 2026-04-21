"use client"

import * as React from "react"
import { useState } from "react"
import { Job, WeatherThresholds, StormMode } from "@/types/schedule.types"
import { mockJobs, mockWeatherData, mockWeatherThresholds, mockStormMode } from "@/lib/mock/schedule-mock-data"
import { WeatherMap } from "@/components/dashboard/schedule/weather/weather-map"
import { WeatherTimeline } from "@/components/dashboard/schedule/weather/weather-timeline"
import { StormModeOverlay } from "@/components/dashboard/schedule/weather/storm-mode-overlay"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { AlertTriangle, PauseCircle, RotateCcw, Send, Download, Settings, Filter } from "lucide-react"

export default function WeatherPage() {
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const [thresholds, setThresholds] = useState<WeatherThresholds>(mockWeatherThresholds)
  const [stormMode, setStormMode] = useState<StormMode>(mockStormMode)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter jobs with weather risk
  const jobsWithRisk = mockJobs.filter(job => job.weatherRisk !== 'low')
  
  // Handle job selection
  const handleJobSelect = (job: Job) => {
    setSelectedJobs(prev => 
      prev.includes(job.id) 
        ? prev.filter(id => id !== job.id)
        : [...prev, job.id]
    )
  }
  
  // Handle threshold changes
  const handleThresholdChange = (key: keyof WeatherThresholds, value: number | { min: number; max: number }) => {
    setThresholds(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Handle storm mode change
  const handleStormModeChange = (newStormMode: StormMode) => {
    setStormMode(newStormMode)
    
    // Update affected jobs based on thresholds
    if (newStormMode.active) {
      const affectedJobs = mockJobs.filter(job => {
        // Simple logic for demo - in real app would use actual weather data
        // Using a seeded approach to keep it pure for the render-like logic if needed
        const mockRisk = job.id.length % 2 === 0;
        return job.weatherRisk === 'high' || 
               (job.weatherRisk === 'medium' && mockRisk)
      }).map(job => job.id)
      
      setStormMode(prev => ({
        ...prev,
        affectedJobs
      }))
    } else {
      setStormMode(prev => ({
        ...prev,
        affectedJobs: []
      }))
    }
  }
  
  // Handle mass actions
  const handleSuggestHold = () => {
    console.log(`Suggest hold for ${selectedJobs.length} jobs`)
    // In a real app, this would analyze weather and suggest holds
  }
  
  const handleReschedule = () => {
    console.log(`Reschedule ${selectedJobs.length} jobs`)
    // In a real app, this would open a reschedule dialog
  }
  
  const handleNotifyClients = () => {
    console.log(`Notify clients for ${selectedJobs.length} jobs`)
    // In a real app, this would send notifications
  }
  
  const handleExport = () => {
    console.log(`Export ${selectedJobs.length} jobs`)
    // In a real app, this would generate and download CSV
  }
  
  // Get affected jobs count
  // const affectedJobsCount = stormMode.active ? stormMode.affectedJobs.length : 0
  
  // Get jobs exceeding thresholds
  const jobsExceedingThresholds = React.useMemo(() => {
    return mockJobs.filter(job => {
      // Mock logic - in real app would compare with actual weather
      const mockRisk = job.id.length % 3 === 0;
      return job.weatherRisk === 'high' || 
             (job.weatherRisk === 'medium' && mockRisk)
    })
  }, [])
  
  return (
    <div className="flex flex-col h-full gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weather</h1>
          <p className="text-muted-foreground">
            Monitor weather conditions and job risks
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weather Thresholds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Wind Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Wind Speed</Label>
                <span className="text-sm">{thresholds.windSpeed} mph</span>
              </div>
              <Slider
                value={[thresholds.windSpeed]}
                onValueChange={(value) => handleThresholdChange('windSpeed', value[0])}
                max={50}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
            
            {/* Precipitation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Precipitation</Label>
                <span className="text-sm">{thresholds.precipitation} inches</span>
              </div>
              <Slider
                value={[thresholds.precipitation]}
                onValueChange={(value) => handleThresholdChange('precipitation', value[0])}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
            
            {/* Hail Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Hail Size</Label>
                <span className="text-sm">{thresholds.hailSize} inches</span>
              </div>
              <Slider
                value={[thresholds.hailSize]}
                onValueChange={(value) => handleThresholdChange('hailSize', value[0])}
                max={3}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
            
            {/* Temperature Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Temperature Range</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs">Min</span>
                    <span className="text-xs">{thresholds.temperature.min}°F</span>
                  </div>
                  <Slider
                    value={[thresholds.temperature.min]}
                    onValueChange={(value) => handleThresholdChange('temperature', {
                      ...thresholds.temperature,
                      min: value[0]
                    })}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs">Max</span>
                    <span className="text-xs">{thresholds.temperature.max}°F</span>
                  </div>
                  <Slider
                    value={[thresholds.temperature.max]}
                    onValueChange={(value) => handleThresholdChange('temperature', {
                      ...thresholds.temperature,
                      max: value[0]
                    })}
                    max={120}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main Content */}
      <div className="flex-1 grid gap-4 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2">
          <WeatherMap
            jobs={jobsWithRisk}
            onJobSelect={handleJobSelect}
            className="h-[400px]"
          />
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          {/* Storm Mode */}
          <StormModeOverlay
            stormMode={stormMode}
            onStormModeChange={handleStormModeChange}
          />
          
          {/* Mass Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Mass Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Selected Jobs</span>
                <Badge variant="outline">{selectedJobs.length}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestHold}
                  disabled={selectedJobs.length === 0}
                  className="justify-start"
                >
                  <PauseCircle className="mr-2 h-4 w-4" />
                  Suggest Hold
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReschedule}
                  disabled={selectedJobs.length === 0}
                  className="justify-start"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reschedule
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNotifyClients}
                  disabled={selectedJobs.length === 0}
                  className="justify-start"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Notify Clients
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={selectedJobs.length === 0}
                  className="justify-start"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Weather Timeline */}
      <div className="lg:col-span-3">
        <WeatherTimeline
          forecast={mockWeatherData.forecast}
        />
      </div>
    </div>
  )
}

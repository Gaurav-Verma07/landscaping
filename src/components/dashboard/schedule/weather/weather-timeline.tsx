"use client"

import * as React from "react"
import { format, addDays } from "date-fns"
import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface WeatherTimelineProps {
  forecast: Array<{
    date: string
    high: number
    low: number
    condition: string
    precipitationChance: number
    windSpeed: number
    humidity: number
  }>
  className?: string
}

export function WeatherTimeline({
  forecast,
  className
}: WeatherTimelineProps) {
  // Get weather icon based on condition
  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase()
    
    if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
      return <Sun className="h-5 w-5" />
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
      return <CloudRain className="h-5 w-5" />
    } else if (lowerCondition.includes('thunder')) {
      return <CloudRain className="h-5 w-5" />
    } else {
      return <Cloud className="h-5 w-5" />
    }
  }
  
  // Get precipitation color
  const getPrecipitationColor = (chance: number) => {
    if (chance >= 70) return "bg-red-500"
    if (chance >= 40) return "bg-yellow-500"
    return "bg-green-500"
  }
  
  // Get wind color
  const getWindColor = (speed: number) => {
    if (speed >= 20) return "text-red-500"
    if (speed >= 10) return "text-yellow-500"
    return "text-green-500"
  }
  
  // Get temperature color
  const getTemperatureColor = (temp: number) => {
    if (temp >= 90) return "text-red-500"
    if (temp >= 80) return "text-orange-500"
    if (temp >= 70) return "text-yellow-500"
    if (temp >= 60) return "text-green-500"
    if (temp >= 50) return "text-blue-500"
    return "text-purple-500"
  }
  
  // Get day name
  const getDayName = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = addDays(today, 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return format(date, 'EEEE')
    }
  }
  
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          7-Day Forecast
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 p-4">
            {forecast.map((day, index) => (
              <div
                key={day.date}
                className={cn(
                  "p-3 rounded-lg border",
                  index === 0 ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                {/* Date */}
                <div className="text-center mb-3">
                  <div className="font-medium">{getDayName(day.date)}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(day.date), 'MMM d')}
                  </div>
                </div>
                
                {/* Weather Icon */}
                <div className="flex justify-center mb-3">
                  {getWeatherIcon(day.condition)}
                </div>
                
                {/* Temperature */}
                <div className="text-center mb-3">
                  <div className="flex justify-center items-center gap-2">
                    <span className={cn("text-lg font-bold", getTemperatureColor(day.high))}>
                      {day.high}°
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className={cn("text-sm", getTemperatureColor(day.low))}>
                      {day.low}°
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">F</div>
                </div>
                
                {/* Condition */}
                <div className="text-center mb-3">
                  <div className="text-sm font-medium">{day.condition}</div>
                </div>
                
                {/* Precipitation */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Droplets className="h-3 w-3" />
                      <span className="text-xs">Precip</span>
                    </div>
                    <span className="text-xs font-medium">{day.precipitationChance}%</span>
                  </div>
                  <Progress
                    value={day.precipitationChance}
                    className="h-1"
                  />
                </div>
                
                {/* Wind */}
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Wind className="h-3 w-3" />
                      <span className="text-xs">Wind</span>
                    </div>
                    <span className={cn("text-xs font-medium", getWindColor(day.windSpeed))}>
                      {day.windSpeed} mph
                    </span>
                  </div>
                </div>
                
                {/* Humidity */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Droplets className="h-3 w-3" />
                      <span className="text-xs">Humidity</span>
                    </div>
                    <span className="text-xs font-medium">{day.humidity}%</span>
                  </div>
                </div>
                
                {/* Alert for high risk days */}
                {day.precipitationChance >= 70 && (
                  <div className="mt-2 pt-2 border-t">
                    <Badge variant="outline" className="w-full justify-center text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      High Risk
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

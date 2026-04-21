"use client"

import * as React from "react"
import { MapPin, Clock, Star, TrendingUp, Users, Zap, Sliders } from "lucide-react"
import { CrewSuggestion } from "@/types/schedule.types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AutoSuggestPaneProps {
  suggestions: CrewSuggestion[]
  onAssignCrew?: (crewId: string) => void
  className?: string
}

export function AutoSuggestPane({
  suggestions,
  onAssignCrew,
  className
}: AutoSuggestPaneProps) {
  const [weights, setWeights] = React.useState({
    distance: 30,
    availability: 40,
    skillMatch: 20,
    workload: 10
  })
  
  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }
  
  // Get availability status
  const getAvailabilityStatus = (available: boolean) => {
    return available ? 
      { text: "Available", color: "text-green-500 bg-green-50" } : 
      { text: "Unavailable", color: "text-red-500 bg-red-50" }
  }
  
  // Get workload color
  const getWorkloadColor = (workload: number) => {
    if (workload <= 0.5) return "bg-green-500"
    if (workload <= 0.8) return "bg-yellow-500"
    return "bg-red-500"
  }
  
  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Auto-Suggest
        </CardTitle>
        
        {/* Weight Sliders */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-3 w-3" />
            <span className="text-xs font-medium">Factor Weights</span>
          </div>
          
          <div className="space-y-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Distance</span>
                <span>{weights.distance}%</span>
              </div>
              <Slider
                value={[weights.distance]}
                onValueChange={(value) => setWeights(prev => ({ ...prev, distance: value[0] }))}
                max={100}
                step={5}
                className="h-1"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Availability</span>
                <span>{weights.availability}%</span>
              </div>
              <Slider
                value={[weights.availability]}
                onValueChange={(value) => setWeights(prev => ({ ...prev, availability: value[0] }))}
                max={100}
                step={5}
                className="h-1"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Skill Match</span>
                <span>{weights.skillMatch}%</span>
              </div>
              <Slider
                value={[weights.skillMatch]}
                onValueChange={(value) => setWeights(prev => ({ ...prev, skillMatch: value[0] }))}
                max={100}
                step={5}
                className="h-1"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Workload</span>
                <span>{weights.workload}%</span>
              </div>
              <Slider
                value={[weights.workload]}
                onValueChange={(value) => setWeights(prev => ({ ...prev, workload: value[0] }))}
                max={100}
                step={5}
                className="h-1"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-auto p-3">
        <div className="space-y-2 p-2">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => {
              const availabilityStatus = getAvailabilityStatus(suggestion.factors.availability)
              
              return (
                <div
                  key={suggestion.crewId}
                  className="p-2 rounded-lg border hover:bg-muted/30 transition-all cursor-pointer"
                  onClick={() => onAssignCrew?.(suggestion.crewId)}
                >
                  {/* Header with score */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>CW</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-lg font-bold", getScoreColor(suggestion.score))}>
                        {suggestion.score}
                      </div>
                      <div className="text-xs text-muted-foreground">match</div>
                    </div>
                  </div>
                  
                  {/* Factors */}
                  <div className="space-y-1 text-xs">
                    {/* Distance */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Distance</span>
                      </div>
                      <span className="font-medium">{suggestion.factors.distance} mi</span>
                    </div>
                    
                    {/* Availability */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Availability</span>
                      </div>
                      <Badge className={cn("text-xs", availabilityStatus.color)}>
                        {availabilityStatus.text}
                      </Badge>
                    </div>
                    
                    {/* Skill Match */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Skill Match</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{suggestion.factors.skillMatch}%</span>
                        <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full" 
                            style={{ width: `${suggestion.factors.skillMatch}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Workload */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>Workload</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{Math.round(suggestion.factors.workload * 100)}%</span>
                        <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full", getWorkloadColor(suggestion.factors.workload))}
                            style={{ width: `${suggestion.factors.workload * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* ETA */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>ETA</span>
                      </div>
                      <span className="font-medium">{suggestion.estimatedETA}</span>
                    </div>
                  </div>
                  
                  {/* Assign Button */}
                  <div className="mt-2 pt-2 border-t">
                    <Button size="sm" className="w-full">
                      Assign Crew
                    </Button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
              <Zap className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-center">No crew suggestions available</p>
              <p className="text-xs text-center mt-1">
                Select a job to see crew recommendations
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

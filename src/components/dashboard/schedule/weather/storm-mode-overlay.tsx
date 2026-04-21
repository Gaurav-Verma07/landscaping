"use client"

import * as React from "react"
import { CloudLightning, Zap, DollarSign, Clock, Users, AlertTriangle, X } from "lucide-react"
import { StormMode } from "@/types/schedule.types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface StormModeOverlayProps {
  stormMode: StormMode
  onStormModeChange?: (stormMode: StormMode) => void
  className?: string
}

export function StormModeOverlay({
  stormMode,
  onStormModeChange,
  className
}: StormModeOverlayProps) {
  const [commissionRate, setCommissionRate] = React.useState(stormMode.commissionRate)
  
  // Handle storm mode toggle
  const handleStormModeToggle = (active: boolean) => {
    const newStormMode: StormMode = {
      ...stormMode,
      active,
      startTime: active ? new Date().toISOString() : undefined,
      endTime: undefined
    }
    
    onStormModeChange?.(newStormMode)
  }
  
  // Handle commission rate change
  const handleCommissionRateChange = (rate: number) => {
    setCommissionRate(rate)
    
    const newStormMode: StormMode = {
      ...stormMode,
      commissionRate: rate
    }
    
    onStormModeChange?.(newStormMode)
  }
  
  // Calculate potential earnings
  const calculatePotentialEarnings = () => {
    if (!stormMode.active || stormMode.affectedJobs.length === 0) return 0
    
    const totalJobValue = stormMode.affectedJobs.length * 5000 // Mock average job value
    return (totalJobValue * commissionRate) / 100
  }
  
  const potentialEarnings = calculatePotentialEarnings()
  
  return (
    <Card className={cn("border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
            <CloudLightning className="h-5 w-5" />
            Storm Mode
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="storm-mode-toggle" className="text-sm">
              Active
            </Label>
            <Switch
              id="storm-mode-toggle"
              checked={stormMode.active}
              onCheckedChange={handleStormModeToggle}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {stormMode.active ? (
          <>
            {/* Commission Rate */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Commission Rate</Label>
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => handleCommissionRateChange(10)}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    commissionRate === 10
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Standard
                  <div className="text-xs opacity-75">10%</div>
                </button>
                <button
                  onClick={() => handleCommissionRateChange(50)}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    commissionRate === 50
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Emergency
                  <div className="text-xs opacity-75">50%</div>
                </button>
              </div>
              <div className="text-xs text-muted-foreground">
                {commissionRate === 50
                  ? "Emergency rate for severe weather conditions"
                  : "Standard commission rate"
                }
              </div>
            </div>
            
            {/* Affected Jobs */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Label className="text-sm font-medium">Affected Jobs</Label>
                <Badge variant="outline" className="ml-auto">
                  {stormMode.affectedJobs.length}
                </Badge>
              </div>
              
              {stormMode.affectedJobs.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {stormMode.affectedJobs.length} jobs affected by current weather conditions
                </div>
              )}
            </div>
            
            {/* Potential Earnings */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <Label className="text-sm font-medium">Potential Earnings</Label>
              </div>
              
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                ${potentialEarnings.toLocaleString()}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Based on {commissionRate}% commission rate
              </div>
            </div>
            
            {/* Storm Duration */}
            {stormMode.startTime && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Label className="text-sm font-medium">Storm Duration</Label>
                </div>
                
                <div className="text-sm">
                  Started: {new Date(stormMode.startTime).toLocaleString()}
                </div>
              </div>
            )}
            
            {/* Alert */}
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Storm Mode Active</p>
                  <p className="text-muted-foreground">
                    All affected jobs are eligible for emergency commission rates.
                    Ensure proper documentation for all storm-related work.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Inactive State */
          <div className="text-center py-6">
            <CloudLightning className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Storm Mode Inactive</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Enable Storm Mode during severe weather events to activate emergency commission rates
              and track storm-related jobs.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

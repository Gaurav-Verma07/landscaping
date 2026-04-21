"use client"

import * as React from "react"
import { Search, MapPin, Phone, Mail, Star, Users, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Crew } from "@/types/schedule.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface CrewRosterProps {
  crews: Crew[]
  selectedCrewId?: string
  onCrewSelect?: (crewId: string) => void
  className?: string
}

export function CrewRoster({
  crews,
  selectedCrewId,
  onCrewSelect,
  className
}: CrewRosterProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState<string>("all")
  
  // Filter crews based on search and status
  const filteredCrews = crews.filter(crew => {
    const matchesSearch = crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         crew.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         crew.location.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || crew.status === filterStatus
    
    return matchesSearch && matchesStatus
  })
  
  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "available":
        return { icon: CheckCircle, color: "text-green-500", label: "Available" }
      case "busy":
        return { icon: Clock, color: "text-blue-500", label: "Busy" }
      case "off-duty":
        return { icon: XCircle, color: "text-gray-500", label: "Off Duty" }
      case "pto":
        return { icon: AlertCircle, color: "text-yellow-500", label: "PTO" }
      default:
        return { icon: Clock, color: "text-gray-500", label: "Unknown" }
    }
  }
  
  // Get availability days
  const getAvailabilityDays = (availability: { [key: string]: boolean }) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    return days.map(day => ({
      day: day.charAt(0).toUpperCase() + day.slice(1, 3),
      available: availability[day]
    }))
  }
  
  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Crew Roster</CardTitle>
        <div className="space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search crews..."
              className="pl-10 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-1">
            {["all", "available", "busy", "off-duty", "pto"].map(status => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className="text-xs h-7 px-2"
              >
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-auto p-0">
        <div className="space-y-2 p-3">
          {filteredCrews.map(crew => {
            const statusInfo = getStatusInfo(crew.status)
            const isSelected = selectedCrewId === crew.id
            const availabilityDays = getAvailabilityDays(crew.availability)
            const workloadPercentage = (crew.currentJobs / crew.maxJobs) * 100
            
            return (
              <div
                key={crew.id}
                className={cn(
                  "p-2 rounded-lg border cursor-pointer transition-all",
                  isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}
                onClick={() => onCrewSelect?.(crew.id)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={crew.avatar} alt={crew.name} />
                      <AvatarFallback>{crew.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-sm">{crew.name}</h3>
                      <div className="flex items-center gap-1">
                        <statusInfo.icon className={cn("h-3 w-3", statusInfo.color)} />
                        <span className="text-xs text-muted-foreground">{statusInfo.label}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{crew.rating}</span>
                  </div>
                </div>
                
                {/* Capacity */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Capacity</span>
                    <span className="text-xs font-medium">{crew.currentJobs}/{crew.maxJobs}</span>
                  </div>
                  <Progress value={workloadPercentage} className="h-1" />
                </div>
                
                {/* Skills */}
                <div className="mb-2">
                  <div className="text-xs text-muted-foreground mb-1">Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {crew.skills.slice(0, 3).map(skill => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {crew.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{crew.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Availability */}
                <div className="mb-2">
                  <div className="text-xs text-muted-foreground mb-1">Availability</div>
                  <div className="flex gap-1">
                    {availabilityDays.map((day, index) => (
                      <div
                        key={index}
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                          day.available ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        )}
                      >
                        {day.day.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Location and Contact */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{crew.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{crew.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>{crew.contact.email}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

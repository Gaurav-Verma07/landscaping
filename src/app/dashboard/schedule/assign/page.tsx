"use client"

import * as React from "react"
import { useState } from "react"
import { Job, CrewSuggestion } from "@/types/schedule.types"
import { mockJobs, mockCrews } from "@/lib/mock/schedule-mock-data"
import { CrewRoster } from "@/components/dashboard/schedule/assign/crew-roster"
import { DispatchBoard } from "@/components/dashboard/schedule/assign/dispatch-board"
import { AutoSuggestPane } from "@/components/dashboard/schedule/assign/auto-suggest-pane"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, CheckCircle } from "lucide-react"

export default function AssignPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedCrewId, setSelectedCrewId] = useState<string | undefined>(undefined)
  const [jobs, setJobs] = useState<Job[]>(mockJobs)
  const [showAuditLog, setShowAuditLog] = useState(false)
  
  // Generate mock suggestions for selected job
  const [suggestions, setSuggestions] = useState<CrewSuggestion[]>([])
  
  // Update suggestions when a job is selected
  React.useEffect(() => {
    if (selectedJob) {
      // Generate mock suggestions based on selected job
      const mockSuggestions: CrewSuggestion[] = mockCrews.map(crew => {
        // Calculate distance (mock)
        const distance = Math.floor(Math.random() * 30) + 5
        
        // Calculate skill match (mock)
        const skillMatch = Math.floor(Math.random() * 40) + 60
        
        // Calculate workload (mock)
        const workload = crew.currentJobs / crew.maxJobs
        
        // Calculate availability (mock)
        const isAvailable = crew.status === 'available' || crew.status === 'busy'
        
        // Calculate ETA based on distance
        const etaMinutes = Math.floor(distance * 2) + 15
        const hours = Math.floor(etaMinutes / 60)
        const minutes = etaMinutes % 60
        const eta = `${hours}:${minutes.toString().padStart(2, '0')}`
        
        // Calculate overall score (mock)
        const score = Math.floor(
          (30 * (1 - distance / 50)) + // Distance (closer is better)
          (40 * (isAvailable ? 1 : 0)) + // Availability
          (20 * (skillMatch / 100)) + // Skill match
          (10 * (1 - workload)) // Workload (less is better)
        )
        
        return {
          crewId: crew.id,
          score,
          factors: {
            distance,
            availability: isAvailable,
            skillMatch,
            workload
          },
          estimatedETA: eta
        }
      }).sort((a, b) => b.score - a.score).slice(0, 5) // Top 5 suggestions
      
      setSuggestions(mockSuggestions)
    } else {
      setSuggestions([])
    }
  }, [selectedJob])
  
  // Handle job status change
  const handleJobStatusChange = (jobId: string, newStatus: Job['status']) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: newStatus } : job
    ))
  }
  
  // Handle job selection
  const handleJobSelect = (job: Job) => {
    setSelectedJob(job)
  }
  
  // Handle crew selection
  const handleCrewSelect = (crewId: string) => {
    setSelectedCrewId(crewId)
  }
  
  // Handle crew assignment from suggestions
  const handleAssignCrew = (crewId: string) => {
    if (selectedJob) {
      // Update job with assigned crew
      setJobs(prev => prev.map(job => 
        job.id === selectedJob.id 
          ? { ...job, crewId, crew: mockCrews.find(c => c.id === crewId)?.name, status: 'assigned' } 
          : job
      ))
      
      // Update crew workload
      // In a real app, this would update the crew's current jobs count
      
      // Clear selection
      setSelectedJob(null)
      setSelectedCrewId(undefined)
    }
  }
  
  // Handle bulk assignment
  const handleBulkAssign = () => {
    // In a real app, this would open a dialog for bulk assignment
    console.log("Bulk assign")
  }
  
  // Handle template assignment
  const handleTemplateAssign = (templateId: string) => {
    // In a real app, this would apply a template
    console.log(`Apply template ${templateId}`)
  }
  
  // Handle export
  const handleExport = () => {
    // In a real app, this would export assignments
    console.log("Export assignments")
  }
  
  // Get job counts by status
  const jobCounts = React.useMemo(() => {
    const counts = {
      new: 0,
      assigned: 0,
      'en-route': 0,
      'on-site': 0,
      completed: 0,
      cancelled: 0
    }
    
    jobs.forEach(job => {
      counts[job.status]++
    })
    
    return counts
  }, [jobs])
  
  return (
    <div className="flex h-full">
      {/* Left Pane - Crew Roster */}
      <div className="w-80 border-r bg-muted/30 hidden md:block">
        <CrewRoster
          crews={mockCrews}
          selectedCrewId={selectedCrewId}
          onCrewSelect={handleCrewSelect}
          className="h-full"
        />
      </div>
      
      {/* Main Pane - Dispatch Board */}
      <div className="flex-1 p-4">
        <DispatchBoard
          jobs={jobs}
          onJobStatusChange={handleJobStatusChange}
          onJobSelect={handleJobSelect}
          className="h-full"
        />
      </div>
      
      {/* Right Pane - Auto-Suggest */}
      <div className="w-80 border-l bg-muted/30 hidden lg:block">
        <AutoSuggestPane
          suggestions={suggestions}
          onAssignCrew={handleAssignCrew}
          className="h-full"
        />
      </div>
      
      {/* Mobile Crew Selection (Bottom Sheet) */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex gap-2 md:hidden z-10">
        <Button variant="outline" size="sm" onClick={() => setShowAuditLog(!showAuditLog)}>
          <CheckCircle className="mr-2 h-4 w-4" />
          {showAuditLog ? 'Hide' : 'Show'} Audit Log
        </Button>
        <Button size="sm" onClick={handleBulkAssign}>
          <Users className="mr-2 h-4 w-4" />
          Bulk Assign
        </Button>
      </div>
      
      {/* Audit Log (Collapsible) */}
      {showAuditLog && (
        <div className="fixed bottom-20 left-0 right-0 bg-background border-t p-4 md:hidden z-10">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Assignment Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Crew Alpha assigned to &quot;Roof Replacement - John Carter&quot;</span>
                  <span className="text-xs text-muted-foreground ml-auto">2 hours ago</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Crew Beta status changed to &quot;En Route&quot; for &quot;Roof Repair - Maria Hernandez&quot;</span>
                  <span className="text-xs text-muted-foreground ml-auto">3 hours ago</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Crew Gamma completed &quot;Commercial Roof Inspection - Kim Peterson&quot;</span>
                  <span className="text-xs text-muted-foreground ml-auto">5 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

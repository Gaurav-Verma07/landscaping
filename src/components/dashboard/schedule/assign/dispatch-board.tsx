"use client"

import * as React from "react"
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, 
  closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { Job } from "@/types/schedule.types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DispatchBoardProps {
  jobs: Job[]
  onJobStatusChange?: (jobId: string, newStatus: Job['status']) => void
  onJobSelect?: (job: Job) => void
  className?: string
}

interface JobCardProps {
  job: Job
  onClick?: () => void
}

// Job Card Component
function JobCard({ job, onClick }: JobCardProps) {
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
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50"
      case "medium":
        return "border-yellow-200 bg-yellow-50"
      case "low":
        return "border-green-200 bg-green-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }
  
  return (
    <div
      className={cn(
        "p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md",
        getPriorityColor(job.priority)
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-1">
        <h4 className="font-medium text-sm line-clamp-1">{job.title}</h4>
        <Badge className={cn("text-xs", getStatusColor(job.status))}>
          {job.status}
        </Badge>
      </div>
      
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>Client:</span>
          <span className="font-medium">{job.client}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <span>Time:</span>
          <span className="font-medium">{job.startTime} - {job.endTime}</span>
        </div>
        
        {job.crew && (
          <div className="flex items-center gap-1">
            <span>Crew:</span>
            <span className="font-medium">{job.crew}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <Badge className={cn("text-xs", getWeatherRiskColor(job.weatherRisk))}>
            {job.weatherRisk} risk
          </Badge>
          
          {job.estimatedValue && (
            <span className="font-medium">${job.estimatedValue.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Column Component
interface ColumnProps {
  title: string
  status: Job['status']
  jobs: Job[]
  onJobClick?: (job: Job) => void
  className?: string
}

function Column({ title, status, jobs, onJobClick, className }: ColumnProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "border-gray-200 bg-gray-50"
      case "assigned":
        return "border-indigo-200 bg-indigo-50"
      case "en-route":
        return "border-blue-200 bg-blue-50"
      case "on-site":
        return "border-purple-200 bg-purple-50"
      case "completed":
        return "border-green-200 bg-green-50"
      case "cancelled":
        return "border-red-200 bg-red-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }
  
  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          {title}
          <Badge variant="outline" className="ml-2 text-xs">
            {jobs.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className={cn("flex-1 overflow-auto p-2", getStatusColor(status))}>
        {jobs.length > 0 ? (
          jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => onJobClick?.(job)}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground p-6">
            <p className="text-sm">No jobs in this column</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Main Dispatch Board Component
export function DispatchBoard({
  jobs,
  onJobStatusChange,
  onJobSelect,
  className
}: DispatchBoardProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  
  // Group jobs by status
  const jobsByStatus = React.useMemo(() => {
    const grouped: Record<Job['status'], Job[]> = {
      new: [],
      assigned: [],
      'en-route': [],
      'on-site': [],
      completed: [],
      cancelled: []
    }
    
    jobs.forEach(job => {
      grouped[job.status].push(job)
    })
    
    return grouped
  }, [jobs])
  
  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }
  
  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    const activeId = active.id as string
    const overId = over.id as string
    
    // Find the active job
    const activeJob = jobs.find(job => job.id === activeId)
    if (!activeJob) return
    
    // If dragging over a status column, update the job status
    if (Object.keys(jobsByStatus).includes(overId)) {
      const newStatus = overId as Job['status']
      if (activeJob.status !== newStatus) {
        onJobStatusChange?.(activeId, newStatus)
      }
    }
  }
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }
    
    const activeId = active.id as string
    const overId = over.id as string
    
    // Find the active job
    const activeJob = jobs.find(job => job.id === activeId)
    if (!activeJob) {
      setActiveId(null)
      return
    }
    
    // If dropping on a status column, update the job status
    if (Object.keys(jobsByStatus).includes(overId)) {
      const newStatus = overId as Job['status']
      if (activeJob.status !== newStatus) {
        onJobStatusChange?.(activeId, newStatus)
      }
    }
    
    setActiveId(null)
  }
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 h-full", className)}>
        <SortableContext items={Object.keys(jobsByStatus)} strategy={verticalListSortingStrategy}>
          <Column
            title="New"
            status="new"
            jobs={jobsByStatus.new}
            onJobClick={onJobSelect}
          />
          
          <Column
            title="Assigned"
            status="assigned"
            jobs={jobsByStatus.assigned}
            onJobClick={onJobSelect}
          />
          
          <Column
            title="En Route"
            status="en-route"
            jobs={jobsByStatus['en-route']}
            onJobClick={onJobSelect}
          />
          
          <Column
            title="On Site"
            status="on-site"
            jobs={jobsByStatus['on-site']}
            onJobClick={onJobSelect}
          />
          
          <Column
            title="Completed"
            status="completed"
            jobs={jobsByStatus.completed}
            onJobClick={onJobSelect}
          />
          
          <Column
            title="Cancelled"
            status="cancelled"
            jobs={jobsByStatus.cancelled}
            onJobClick={onJobSelect}
          />
        </SortableContext>
      </div>
    </DndContext>
  )
}

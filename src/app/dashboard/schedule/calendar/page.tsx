"use client"

import * as React from "react"
import { useState } from "react"
import { format, addDays, startOfWeek } from "date-fns"
import { Calendar, Filter, Plus, ChevronLeft, ChevronRight, Search, Cloud, Users, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CalendarView } from "@/components/dashboard/schedule/calendar/calendar-view"
import { EventDrawer } from "@/components/dashboard/schedule/calendar/event-drawer"
import { mockJobs, mockCrews } from "@/lib/mock/schedule-mock-data"
import { Job } from "@/types/schedule.types"
import { cn } from "@/lib/utils"

export default function CalendarPage() {
  const [view, setView] = useState<'month' | 'week' | 'day' | 'list'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    crew: "",
    status: "",
    weatherRisk: ""
  })
  
  // Filter jobs based on search and filters
  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCrew = !filters.crew || job.crewId === filters.crew
    const matchesStatus = !filters.status || job.status === filters.status
    const matchesWeatherRisk = !filters.weatherRisk || job.weatherRisk === filters.weatherRisk
    
    return matchesSearch && matchesCrew && matchesStatus && matchesWeatherRisk
  })
  
  // Handle event click
  const handleEventClick = (job: Job) => {
    setSelectedJob(job)
    setIsDrawerOpen(true)
  }
  
  // Handle event drop
  const handleEventDrop = (jobId: string, newDate: string) => {
    console.log(`Job ${jobId} moved to ${newDate}`)
    // In a real app, this would update the job in the database
  }
  
  // Handle date selection
  const handleDateSelect = (start: string, end: string) => {
    console.log(`Selected date range: ${start} to ${end}`)
    // In a real app, this would open a new job dialog with pre-filled dates
  }
  
  // Navigate to previous period
  const navigatePrevious = () => {
    let newDate: Date
    switch (view) {
      case 'month':
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        break
      case 'week':
        newDate = addDays(currentDate, -7)
        break
      case 'day':
        newDate = addDays(currentDate, -1)
        break
      case 'list':
        newDate = addDays(currentDate, -7)
        break
      default:
        newDate = currentDate
    }
    setCurrentDate(newDate)
  }
  
  // Navigate to next period
  const navigateNext = () => {
    let newDate: Date
    switch (view) {
      case 'month':
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
        break
      case 'week':
        newDate = addDays(currentDate, 7)
        break
      case 'day':
        newDate = addDays(currentDate, 1)
        break
      case 'list':
        newDate = addDays(currentDate, 7)
        break
      default:
        newDate = currentDate
    }
    setCurrentDate(newDate)
  }
  
  // Navigate to today
  const navigateToday = () => {
    setCurrentDate(new Date())
  }
  
  // Get current date range text
  const getDateRangeText = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy')
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
        const weekEnd = addDays(weekStart, 6)
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy')
      case 'list':
        const listStart = startOfWeek(currentDate, { weekStartsOn: 0 })
        const listEnd = addDays(listStart, 6)
        return `${format(listStart, 'MMM d')} - ${format(listEnd, 'MMM d, yyyy')}`
      default:
        return ""
    }
  }
  
  // Handle drawer actions
  const handleAssign = (jobId: string) => {
    console.log(`Assign crew to job ${jobId}`)
    setIsDrawerOpen(false)
  }
  
  const handleMessage = (jobId: string) => {
    console.log(`Message crew for job ${jobId}`)
    setIsDrawerOpen(false)
  }
  
  const handleUpload = (jobId: string) => {
    console.log(`Upload media for job ${jobId}`)
    setIsDrawerOpen(false)
  }
  
  const handleInvoice = (jobId: string) => {
    console.log(`Create invoice for job ${jobId}`)
    setIsDrawerOpen(false)
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-6 p-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={navigateToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="min-w-[200px] text-center font-medium">
              {getDateRangeText()}
            </div>
          </div>
          
          {/* View Switcher */}
          <div className="flex items-center gap-2">
            <Select value={view} onValueChange={(value: 'month' | 'week' | 'day' | 'list') => setView(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="list">List</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search jobs..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filters.crew} onValueChange={(value) => setFilters(prev => ({ ...prev, crew: value }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Crews" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Crews</SelectItem>
                {mockCrews.map(crew => (
                  <SelectItem key={crew.id} value={crew.id}>{crew.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="en-route">En Route</SelectItem>
                <SelectItem value="on-site">On Site</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.weatherRisk} onValueChange={(value) => setFilters(prev => ({ ...prev, weatherRisk: value }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Calendar */}
      <div className="flex-1 p-6 pt-2">
        <CalendarView
          jobs={filteredJobs}
          view={view}
          onEventClick={handleEventClick}
          onEventDrop={handleEventDrop}
          onDateSelect={handleDateSelect}
          className="h-full"
        />
      </div>
      
      {/* Event Drawer */}
      <EventDrawer
        job={selectedJob}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onAssign={handleAssign}
        onMessage={handleMessage}
        onUpload={handleUpload}
        onInvoice={handleInvoice}
      />
    </div>
  )
}

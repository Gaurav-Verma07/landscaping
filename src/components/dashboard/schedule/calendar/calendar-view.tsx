"use client"

import * as React from "react"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { Job } from '@/types/schedule.types'
import { cn } from '@/lib/utils'

interface CalendarViewProps {
  jobs: Job[]
  view: 'month' | 'week' | 'day' | 'list'
  onEventClick: (job: Job) => void
  onEventDrop: (jobId: string, newDate: string) => void
  onDateSelect: (start: string, end: string) => void
  className?: string
}

export function CalendarView({
  jobs,
  view,
  onEventClick,
  onEventDrop,
  onDateSelect,
  className
}: CalendarViewProps) {
  const calendarRef = React.useRef<FullCalendar>(null)
  
  // Convert jobs to FullCalendar events
  const events = jobs.map(job => ({
    id: job.id,
    title: job.title,
    start: `${job.date}T${job.startTime}`,
    end: `${job.date}T${job.endTime}`,
    extendedProps: {
      job,
      status: job.status,
      weatherRisk: job.weatherRisk,
      priority: job.priority
    },
    backgroundColor: getEventColor(job.status, job.weatherRisk),
    borderColor: getEventBorderColor(job.status, job.weatherRisk),
    textColor: '#ffffff'
  }))
  
  // Get event color based on status and weather risk
  function getEventColor(status: string, weatherRisk: string) {
    if (status === 'completed') return '#10b981' // green
    if (status === 'cancelled') return '#ef4444' // red
    
    // For active jobs, color by weather risk
    if (weatherRisk === 'high') return '#ef4444' // red
    if (weatherRisk === 'medium') return '#f59e0b' // amber
    return '#3b82f6' // blue
  }
  
  // Get event border color
  function getEventBorderColor(status: string, weatherRisk: string) {
    if (status === 'completed') return '#059669' // green-700
    if (status === 'cancelled') return '#dc2626' // red-700
    
    if (weatherRisk === 'high') return '#dc2626' // red-700
    if (weatherRisk === 'medium') return '#d97706' // amber-700
    return '#2563eb' // blue-700
  }
  
  // Handle event click
  const handleEventClick = (info: any) => {
    const job = info.event.extendedProps.job as Job
    onEventClick(job)
  }
  
  // Handle event drop
  const handleEventDrop = (info: any) => {
    const jobId = info.event.id
    const newDate = info.event.start.toISOString().split('T')[0]
    onEventDrop(jobId, newDate)
  }
  
  // Handle date selection
  const handleDateSelect = (info: any) => {
    const start = info.startStr
    const end = info.endStr
    onDateSelect(start, end)
  }
  
  // Render event content
  const renderEventContent = (eventInfo: any) => {
    const job = eventInfo.event.extendedProps.job as Job
    const isAllDay = eventInfo.event.allDay
    
    return (
      <div className="p-1 overflow-hidden">
        <div className="font-medium truncate">{eventInfo.event.title}</div>
        {!isAllDay && (
          <div className="text-xs opacity-90">
            {formatTime(job.startTime)} - {formatTime(job.endTime)}
          </div>
        )}
        <div className="flex items-center gap-1 mt-1">
          <span className={cn(
            "inline-block w-2 h-2 rounded-full",
            job.weatherRisk === 'high' ? "bg-red-300" :
            job.weatherRisk === 'medium' ? "bg-yellow-300" :
            "bg-green-300"
          )} />
          <span className="text-xs opacity-90">{job.crew || 'Unassigned'}</span>
        </div>
      </div>
    )
  }
  
  // Format time helper
  function formatTime(time: string) {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }
  
  // Get FullCalendar view type
  const getFullCalendarView = () => {
    switch (view) {
      case 'month': return 'dayGridMonth'
      case 'week': return 'timeGridWeek'
      case 'day': return 'timeGridDay'
      case 'list': return 'listWeek'
      default: return 'dayGridMonth'
    }
  }
  
  return (
    <div className={cn("h-full p-4", className)}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={getFullCalendarView()}
        headerToolbar={false} // We'll use our own header
        events={events}
        editable={true}
        droppable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        select={handleDateSelect}
        eventContent={renderEventContent}
        height="100%"
        aspectRatio={view === 'month' ? 1.5 : undefined}
        allDaySlot={view !== 'month'}
        slotMinTime="06:00:00"
        slotMaxTime="20:00:00"
        nowIndicator={true}
        scrollTime="08:00:00"
      />
    </div>
  )
}

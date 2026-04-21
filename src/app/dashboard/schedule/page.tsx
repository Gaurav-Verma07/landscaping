"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns"
import { Calendar, CalendarDays, Users, Cloud, Plus, AlertTriangle, Clock, MapPin, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { mockJobs, mockCrews, mockWeatherData } from "@/lib/mock/schedule-mock-data"
import { cn } from "@/lib/utils"

export default function SchedulePage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  
  // Calculate today's jobs
  const todayJobs = mockJobs.filter(job => {
    const jobDate = new Date(job.date)
    return isSameDay(jobDate, new Date())
  })
  
  // Calculate active crews
  const activeCrews = mockCrews.filter(crew => crew.status === 'available' || crew.status === 'busy')
  
  // Get weather risk level
  const getWeatherRiskLevel = () => {
    const hasHighRisk = todayJobs.some(job => job.weatherRisk === 'high')
    const hasMediumRisk = todayJobs.some(job => job.weatherRisk === 'medium')
    
    if (hasHighRisk) return { level: 'High', color: 'text-red-500 bg-red-50' }
    if (hasMediumRisk) return { level: 'Medium', color: 'text-yellow-500 bg-yellow-50' }
    return { level: 'Low', color: 'text-green-500 bg-green-50' }
  }
  
  const weatherRisk = getWeatherRiskLevel()
  
  // Get recent alerts
  const recentAlerts = mockWeatherData.alerts.filter(alert => {
    const alertDate = new Date(alert.startTime)
    const now = new Date()
    const diffInHours = (now.getTime() - alertDate.getTime()) / (1000 * 60 * 60)
    return diffInHours <= 24 // Alerts in the last 24 hours
  })
  
  // Navigate to calendar if no jobs
  React.useEffect(() => {
    if (mockJobs.length === 0) {
      router.push('/dashboard/schedule/calendar')
    }
  }, [router])
  
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            Manage your jobs, crews, and weather-related scheduling
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/schedule/calendar')}>
          <Plus className="mr-2 h-4 w-4" />
          Quick Add Job
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Mini Calendar */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Calendar</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border-0"
              showOutsideDays={false}
            />
          </CardContent>
        </Card>
        
        {/* Today's Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Jobs</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayJobs.filter(job => job.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>
        
        {/* Active Crews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Crews</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCrews.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockCrews.filter(crew => crew.status === 'available').length} available
            </p>
          </CardContent>
        </Card>
        
        {/* Weather Badge */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weather Risk</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={cn(weatherRisk.color)}>
                {weatherRisk.level}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {mockWeatherData.current.temperature}°F
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockWeatherData.current.condition}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Navigation Buttons */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => router.push('/dashboard/schedule/calendar')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar
            </CardTitle>
            <CardDescription>
              View and manage your schedule in calendar format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {mockJobs.length} total jobs
              </span>
              <Button variant="outline" size="sm">
                Go to Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => router.push('/dashboard/schedule/assign')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assign Crews
            </CardTitle>
            <CardDescription>
              Manage crew assignments and availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {mockCrews.length} crews available
              </span>
              <Button variant="outline" size="sm">
                Go to Assign
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => router.push('/dashboard/schedule/weather')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Weather Alerts
            </CardTitle>
            <CardDescription>
              Monitor weather conditions and job risks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {recentAlerts.length} active alerts
              </span>
              <Button variant="outline" size="sm">
                Go to Weather
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Alerts and Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAlerts.length > 0 ? (
              <div className="space-y-3">
                {recentAlerts.map((alert, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'outline'}>
                      {alert.type}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.startTime), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Cloud className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent weather alerts</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start" onClick={() => router.push('/dashboard/projects')}>
                <DollarSign className="mr-2 h-4 w-4" />
                New Project
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => router.push('/dashboard/estimates/quick')}>
                <Clock className="mr-2 h-4 w-4" />
                Quick Quote
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => router.push('/dashboard/clients')}>
                <Users className="mr-2 h-4 w-4" />
                Add Client
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => router.push('/dashboard/schedule/weather')}>
                <Cloud className="mr-2 h-4 w-4" />
                Weather Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

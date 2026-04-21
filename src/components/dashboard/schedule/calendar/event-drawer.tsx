"use client"

import * as React from "react"
import { format } from "date-fns"
import { MapPin, Clock, Users, AlertTriangle, DollarSign, MessageSquare, Upload, FileText, X, Navigation, Phone, Mail } from "lucide-react"
import { Job } from "@/types/schedule.types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

interface EventDrawerProps {
  job: Job | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign?: (jobId: string) => void
  onMessage?: (jobId: string) => void
  onUpload?: (jobId: string) => void
  onInvoice?: (jobId: string) => void
}

export function EventDrawer({
  job,
  open,
  onOpenChange,
  onAssign,
  onMessage,
  onUpload,
  onInvoice
}: EventDrawerProps) {
  if (!job) return null
  
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
        return "text-red-500 bg-red-50"
      case "medium":
        return "text-yellow-500 bg-yellow-50"
      case "low":
        return "text-green-500 bg-green-50"
      default:
        return "text-gray-500 bg-gray-50"
    }
  }
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg">{job.title}</DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>
        
        <div className="px-4 pb-4 overflow-auto">
          {/* Status and Priority */}
          <div className="flex gap-2 mb-4">
            <Badge className={cn(getStatusColor(job.status))}>
              {job.status}
            </Badge>
            <Badge className={cn(getPriorityColor(job.priority))}>
              {job.priority} priority
            </Badge>
            <Badge className={cn(getWeatherRiskColor(job.weatherRisk))}>
              {job.weatherRisk} weather risk
            </Badge>
          </div>
          
          {/* Client and Location */}
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{job.client}</p>
                <p className="text-sm text-muted-foreground">Client</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{job.location}</p>
                <p className="text-sm text-muted-foreground">Location</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {format(new Date(job.date), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {job.startTime} - {job.endTime}
                  {job.ETA && ` (ETA: ${job.ETA})`}
                </p>
              </div>
            </div>
            
            {job.crew && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{job.crew}</p>
                  <p className="text-sm text-muted-foreground">Assigned Crew</p>
                </div>
              </div>
            )}
          </div>
          
          <Separator className="my-4" />
          
          {/* Job Details */}
          <div className="space-y-3 mb-4">
            {job.estimatedValue && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">${job.estimatedValue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Estimated Value</p>
                </div>
              </div>
            )}
            
            {job.attachments && job.attachments > 0 && (
              <div className="flex items-start gap-3">
                <Upload className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{job.attachments} files</p>
                  <p className="text-sm text-muted-foreground">Attachments</p>
                </div>
              </div>
            )}
            
            {job.tags && job.tags.length > 0 && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Tags</p>
                </div>
              </div>
            )}
            
            {job.notes && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm">{job.notes}</p>
                  <p className="text-sm text-muted-foreground">Notes</p>
                </div>
              </div>
            )}
          </div>
          
          <Separator className="my-4" />
          
          {/* Actions */}
          <div className="space-y-3">
            <h3 className="font-medium">Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => onAssign?.(job.id)}
              >
                <Users className="mr-2 h-4 w-4" />
                Assign Crew
              </Button>
              
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => onMessage?.(job.id)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message Crew
              </Button>
              
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => onUpload?.(job.id)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Media
              </Button>
              
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => onInvoice?.(job.id)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(job.location)}`, '_blank')}
            >
              <Navigation className="mr-2 h-4 w-4" />
              Get Directions
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

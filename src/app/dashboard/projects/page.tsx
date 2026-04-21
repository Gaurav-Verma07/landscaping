"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Search, Filter, Plus, Upload, Download, MapPin, Users, DollarSign, CheckCircle, Clock, MoreHorizontal, Grid, List, ChevronRight, X, MessageSquare, Cloud, Brain, Map as MapIcon, FileText, ChevronLeft, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NewProjectDialog } from "@/components/dashboard/projects/new-project-dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Project } from "@/lib/mock/backend"
import { clearMockContext, readMockContext, setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"

type ProjectRow = Project

export default function ProjectsPage() {
  const db = useMockDb()
  const projects = db.projects
  const clientNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of db.clients) map.set(c.id, c.name)
    return map
  }, [db.clients])

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const selectedProject = useMemo<ProjectRow | null>(() => {
    if (!selectedProjectId) return null
    return projects.find((p) => p.id === selectedProjectId) ?? null
  }, [projects, selectedProjectId])
  const [selectedTab, setSelectedTab] = useState("active")
  const [viewMode, setViewMode] = useState<"list" | "card">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [filters, setFilters] = useState({
    status: "",
    crew: "",
    rep: "",
    weather: "",
    tag: ""
  })
  const [quickNote, setQuickNote] = useState("")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)
  const [prefillClientId, setPrefillClientId] = useState<string | undefined>(undefined)
  const [prefillClientName, setPrefillClientName] = useState<string | undefined>(undefined)
  const isMobile = useIsMobile()

  React.useEffect(() => {
    const ctx = readMockContext()
    if (!ctx?.clientId) return
    setPrefillClientId(ctx.clientId)
    setPrefillClientName(db.clients.find((c) => c.id === ctx.clientId)?.name)
    setIsNewProjectDialogOpen(true)
    clearMockContext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter projects based on selected tab and filters
  const filteredProjects = projects.filter((project) => {
    const matchesTab = 
      (selectedTab === "active" && project.status === "Active") ||
      (selectedTab === "pending" && project.status === "Pending") ||
      (selectedTab === "completed" && project.status === "Completed") ||
      selectedTab === "media" || selectedTab === "templates"
    
    const clientName = (clientNameById.get(project.clientId) ?? project.clientId).toLowerCase()
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      clientName.includes(q) ||
      project.location.toLowerCase().includes(q) ||
      (project.description ?? "").toLowerCase().includes(q) ||
      project.name.toLowerCase().includes(q)
    
    return matchesTab && matchesSearch
  })

  const handleSelectProject = (project: ProjectRow) => {
    setSelectedProjectId(project.id)
  }

  const handleSelectAllProjects = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(filteredProjects.map(p => p.id))
    } else {
      setSelectedProjects([])
    }
  }

  const handleToggleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, projectId])
    } else {
      setSelectedProjects(prev => prev.filter(id => id !== projectId))
    }
  }

  const handleProjectAdded = (newProject: ProjectRow) => {
    const now = new Date().toISOString()
    setMockDb((prev) => ({
      ...prev,
      projects: upsertById(prev.projects, { ...newProject, updatedAt: now }),
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getWeatherRiskColor = (risk: string) => {
    switch (risk) {
      case "High":
        return "text-red-500 bg-red-50"
      case "Medium":
        return "text-yellow-500 bg-yellow-50"
      case "Low":
        return "text-green-500 bg-green-50"
      default:
        return "text-gray-500 bg-gray-50"
    }
  }

  return (
    <div className="flex h-full">
      {/* Left Pane - Tabs */}
      {!isMobile ? (
        <div className="w-64 border-r bg-muted/30 p-4 hidden md:block">
          <h2 className="text-lg font-semibold mb-4">Projects</h2>
          <div className="space-y-1">
            <Button
              variant={selectedTab === "active" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTab("active")}
            >
              <Users className="mr-2 h-4 w-4" />
              Active (12)
            </Button>
            <Button
              variant={selectedTab === "pending" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTab("pending")}
            >
              <Clock className="mr-2 h-4 w-4" />
              Pending (5)
            </Button>
            <Button
              variant={selectedTab === "completed" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTab("completed")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Completed (34)
            </Button>
            <Button
              variant={selectedTab === "media" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTab("media")}
            >
              <Upload className="mr-2 h-4 w-4" />
              Media Uploads
            </Button>
            <Button
              variant={selectedTab === "templates" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTab("templates")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-b bg-muted/30 p-4 md:hidden">
          <div className="flex overflow-x-auto space-x-2 pb-2">
            <Button
              variant={selectedTab === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTab("active")}
            >
              Active (12)
            </Button>
            <Button
              variant={selectedTab === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTab("pending")}
            >
              Pending (5)
            </Button>
            <Button
              variant={selectedTab === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTab("completed")}
            >
              Completed (34)
            </Button>
            <Button
              variant={selectedTab === "media" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTab("media")}
            >
              Media
            </Button>
            <Button
              variant={selectedTab === "templates" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTab("templates")}
            >
              Templates
            </Button>
          </div>
        </div>
      )}

      {/* Main Pane - Project List / Detail */}
      <div className="flex-1 flex flex-col">
        {/* Header with Search and Actions */}
        <div className="border-b p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search projects..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsFiltersOpen(true)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Quick Quote → Project
              </Button>
              <Button size="sm" onClick={() => setIsNewProjectDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>

        {/* View Toggle and Bulk Actions */}
        <div className="border-b p-4 flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
          {selectedProjects.length > 0 && (
            <div className="flex gap-2 items-center">
              <Badge variant="secondary">{selectedProjects.length} selected</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Assign Crew</DropdownMenuItem>
                  <DropdownMenuItem>Update Status</DropdownMenuItem>
                  <DropdownMenuItem>Send Invoices</DropdownMenuItem>
                  <DropdownMenuItem>Export CSV</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">Delete Projects</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Project List / Detail View */}
        <div className="flex-1 overflow-auto">
          {selectedProject ? (
            // Project Detail View
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Project #{selectedProject.id}</h2>
                  <p className="text-muted-foreground">
                    {(clientNameById.get(selectedProject.clientId) ?? selectedProject.clientId)} - {selectedProject.location}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setSelectedProjectId(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Back to List
                </Button>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-10">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="estimates">Estimates</TabsTrigger>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="crew">Crew</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="insurance">Insurance</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="docs">Docs</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(selectedProject.status)}
                            <span>{selectedProject.status}</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Scheduled Date</Label>
                          <p className="mt-1">{selectedProject.scheduledDate}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Crew</Label>
                          <p className="mt-1">{selectedProject.crew}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Est. Value</Label>
                          <p className="mt-1">${selectedProject.estValue.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="mt-1">{selectedProject.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="schedule" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Schedule information will be displayed here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="estimates" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Estimates & Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Estimates and invoices will be displayed here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="materials" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Materials & Costs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Materials and costs will be displayed here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="crew" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Crew & Assignments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Crew assignments will be displayed here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="media" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Media (Before/During/After)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Upload Project Media</p>
                        <p className="text-sm text-muted-foreground mb-4">Upload before, during, and after photos</p>
                        <Button>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Media
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="tasks" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tasks & Checklists</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Project tasks and checklists will be displayed here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="insurance" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Insurance & Claims</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Insurance information and claims will be displayed here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="activity" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Project activity history will be displayed here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="docs" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Project documents will be displayed here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            // Project List View
            <div className="p-4">
              {viewMode === "list" ? (
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-auto">
                    <Table className="w-full">
                      <TableHeader className="bg-muted sticky top-0 z-20">
                    <TableRow>
                          <TableHead className="w-12 px-2 py-3 whitespace-nowrap">
                        <Checkbox
                          checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                          onCheckedChange={handleSelectAllProjects}
                        />
                      </TableHead>
                          <TableHead className="px-2 py-3 whitespace-nowrap">Project #</TableHead>
                          <TableHead className="px-2 py-3 whitespace-nowrap">Client</TableHead>
                          <TableHead className="px-2 py-3 whitespace-nowrap">Status</TableHead>
                          <TableHead className="px-2 py-3 whitespace-nowrap">Scheduled Date</TableHead>
                          <TableHead className="px-2 py-3 whitespace-nowrap">Crew</TableHead>
                          <TableHead className="px-2 py-3 whitespace-nowrap">Location</TableHead>
                          <TableHead className="px-2 py-3 whitespace-nowrap">Est. Value</TableHead>
                          <TableHead className="px-2 py-3 whitespace-nowrap">Overdue?</TableHead>
                          <TableHead className="px-2 py-3 whitespace-nowrap">Weather Risk</TableHead>
                          <TableHead className="w-12 px-2 py-3 whitespace-nowrap"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow
                        key={project.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSelectProject(project)}
                      >
                            <TableCell className="px-2 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedProjects.includes(project.id)}
                            onCheckedChange={(checked) => handleToggleProjectSelection(project.id, !!checked)}
                          />
                        </TableCell>
                            <TableCell className="px-2 py-3 whitespace-nowrap font-medium">#{project.id}</TableCell>
                            <TableCell className="px-2 py-3 whitespace-nowrap">
                              {clientNameById.get(project.clientId) ?? project.clientId}
                            </TableCell>
                            <TableCell className="px-2 py-3 whitespace-nowrap">
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            {getStatusIcon(project.status)}
                            {project.status}
                          </Badge>
                        </TableCell>
                            <TableCell className="px-2 py-3 whitespace-nowrap">{project.scheduledDate}</TableCell>
                            <TableCell className="px-2 py-3 whitespace-nowrap">{project.crew}</TableCell>
                            <TableCell className="px-2 py-3 whitespace-nowrap">{project.location}</TableCell>
                            <TableCell className="px-2 py-3 whitespace-nowrap">${project.estValue.toLocaleString()}</TableCell>
                            <TableCell className="px-2 py-3 whitespace-nowrap">
                          {project.overdue ? (
                            <Badge variant="destructive">Yes</Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                            <TableCell className="px-2 py-3 whitespace-nowrap">
                          <Badge variant="outline" className={getWeatherRiskColor(project.weatherRisk)}>
                            {project.weatherRisk}
                          </Badge>
                        </TableCell>
                            <TableCell className="px-2 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>View</DropdownMenuItem>
                              <DropdownMenuItem>Quick Edit</DropdownMenuItem>
                              <DropdownMenuItem>Assign</DropdownMenuItem>
                              <DropdownMenuItem>Send Invoice</DropdownMenuItem>
                              <DropdownMenuItem>Upload Media</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((project) => (
                    <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSelectProject(project)}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">#{project.id}</CardTitle>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getStatusIcon(project.status)}
                            {project.status}
                          </Badge>
                        </div>
                        <CardDescription>{clientNameById.get(project.clientId) ?? project.clientId}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Location:</span>
                            <span className="text-sm">{project.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Scheduled:</span>
                            <span className="text-sm">{project.scheduledDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Crew:</span>
                            <span className="text-sm">{project.crew}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Est. Value:</span>
                            <span className="text-sm font-medium">${project.estValue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Weather Risk:</span>
                            <Badge variant="outline" className={getWeatherRiskColor(project.weatherRisk)}>
                              {project.weatherRisk}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4 px-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {selectedProjects.length} of {filteredProjects.length} row(s) selected.
            </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select defaultValue="10">
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="40">40</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              </div>
            <div className="flex w-[100px] justify-center text-sm font-medium">
              Page 1 of 1
          </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                disabled
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
            </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                disabled
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
            </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                disabled
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
            </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                disabled
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
            </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Utility Rail */}
      {!isMobile ? (
        <div className="w-80 border-l bg-muted/30 p-4 hidden lg:block">
          <div className="space-y-6">
            {/* AI Actions */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                AI Actions
              </h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Auto-fill Estimate
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Measure Roof
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Create Invoice
                </Button>
              </div>
            </div>

            <Separator />

            {/* Weather Widget */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center">
                <Cloud className="h-4 w-4 mr-2" />
                Weather
              </h3>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">72°F</span>
                    <Cloud className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Partly Cloudy</p>
                  <p className="text-xs text-muted-foreground mt-1">Low risk of precipitation</p>
                  <div className="mt-3 pt-3 border-t flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>Downtown Area</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Quick Notes */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Quick Notes
              </h3>
              <Textarea
                placeholder="Add a quick note for crew..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                className="min-h-24"
              />
              <Button size="sm" className="w-full mt-2">
                Add Note
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-4 right-4 z-10 lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
                <Brain className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Brain className="h-4 w-4 mr-2" />
                Auto-fill Estimate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MapIcon className="h-4 w-4 mr-2" />
                Measure Roof
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DollarSign className="h-4 w-4 mr-2" />
                Create Invoice
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Cloud className="h-4 w-4 mr-2" />
                Weather: 72°F, Partly Cloudy
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Quick Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Filters Modal */}
      {isFiltersOpen && (
        <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Filter Projects</DialogTitle>
              <DialogDescription>
                Apply filters to narrow down your project list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="crew-filter">Crew</Label>
                <Select value={filters.crew} onValueChange={(value) => setFilters(prev => ({ ...prev, crew: value }))}>
                  <SelectTrigger id="crew-filter">
                    <SelectValue placeholder="All Crews" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Crews</SelectItem>
                    <SelectItem value="crew-a">Crew A</SelectItem>
                    <SelectItem value="crew-b">Crew B</SelectItem>
                    <SelectItem value="crew-c">Crew C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="weather-filter">Weather Risk</Label>
                <Select value={filters.weather} onValueChange={(value) => setFilters(prev => ({ ...prev, weather: value }))}>
                  <SelectTrigger id="weather-filter">
                    <SelectValue placeholder="All Risk Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Risk Levels</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setFilters({ status: "", crew: "", rep: "", weather: "", tag: "" })}>
                Clear All
              </Button>
              <Button onClick={() => setIsFiltersOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New Project Dialog */}
      <NewProjectDialog
        open={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
        onProjectAdded={handleProjectAdded}
        defaultClientId={prefillClientId}
        defaultClientName={prefillClientName}
      />
    </div>
  )
}

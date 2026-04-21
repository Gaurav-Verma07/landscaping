"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconFilter,
  IconLoader,
  IconPlus,
  IconUpload,
  IconX,
} from "@tabler/icons-react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

import { NewClientDialog } from "@/components/dashboard/clients/new-client-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Client } from "@/lib/mock/backend"
import { setMockContext, setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"

type ClientsFilters = {
  nameSort: "none" | "asc" | "desc"
  status: string
  rep: string
  homeType: string
  roofType: string
  leadSource: string
  isInsuranceJob: boolean
  isStormLead: boolean
  isOverdueOnly: boolean
  dateFrom: string
  dateTo: string
  tags: string[]
}

function StatusBadge({ status }: { status: string }) {
  const isCompleted = status === "Completed"
  return (
    <Badge variant="outline" className="text-muted-foreground px-1.5">
      {isCompleted ? (
        <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 size-3" />
      ) : (
        <IconLoader className="mr-1 size-3" />
      )}
      {status}
    </Badge>
  )
}

function ClientDetailsDialog({
  client,
  open,
  onOpenChange,
  onCreateEstimate,
  onCreateInvoice,
  onCreateProject,
}: {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateEstimate: () => void
  onCreateInvoice: () => void
  onCreateProject: () => void
}) {
  if (!client) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span className="truncate">{client.name}</span>
            <StatusBadge status={client.status} />
          </DialogTitle>
          <DialogDescription className="truncate">{client.propertyAddress}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Contact</div>
            <div className="text-sm">
              <div>{client.phone || "-"}</div>
              <div className="text-muted-foreground">{client.email || "-"}</div>
              <div className="text-muted-foreground">{client.preferredContact || "-"}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Assignment</div>
            <div className="text-sm">
              <div>Rep: {client.rep}</div>
              <div className="text-muted-foreground">Lead: {client.leadSource || "-"}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Property</div>
            <div className="text-sm">
              <div>Home: {client.homeType || "-"}</div>
              <div className="text-muted-foreground">Roof: {client.roofType || "-"}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Insurance</div>
            <div className="text-sm">
              <div>Carrier: {client.carrier || "-"}</div>
              <div className="text-muted-foreground">Claim: {client.claimNo || "-"}</div>
            </div>
          </div>
        </div>

        {client.internalNotes ? (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Notes</div>
            <div className="text-sm whitespace-pre-wrap">{client.internalNotes}</div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCreateProject}>
            New project
          </Button>
          <Button variant="outline" onClick={onCreateInvoice}>
            Create invoice
          </Button>
          <Button onClick={onCreateEstimate}>Create estimate</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ClientCard({
  client,
  onView,
  onCreateEstimate,
  onCreateInvoice,
  onCreateProject,
}: {
  client: Client
  onView: () => void
  onCreateEstimate: () => void
  onCreateInvoice: () => void
  onCreateProject: () => void
}) {
  return (
    <Card className="py-5">
      <CardHeader className="pb-2">
        <div className="min-w-0">
          <CardTitle className="truncate">{client.name}</CardTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={client.status} />
            <span className="text-xs text-muted-foreground truncate">{client.propertyAddress}</span>
          </div>
        </div>

        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              >
                <IconDotsVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onView}>View details</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onCreateEstimate}>Create estimate</DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateInvoice}>Create invoice</DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateProject}>New project</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="truncate">
            <span className="text-muted-foreground">Phone: </span>
            {client.phone || "-"}
          </div>
          <div className="truncate">
            <span className="text-muted-foreground">Email: </span>
            {client.email || "-"}
          </div>
          <div className="truncate">
            <span className="text-muted-foreground">Rep: </span>
            {client.rep}
          </div>
          <div className="truncate">
            <span className="text-muted-foreground">Lead: </span>
            {client.leadSource || "-"}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onView}>
          View
        </Button>
        <Button variant="outline" size="sm" onClick={onCreateProject}>
          Project
        </Button>
        <Button variant="outline" size="sm" onClick={onCreateInvoice}>
          Invoice
        </Button>
        <Button size="sm" onClick={onCreateEstimate}>
          Estimate
        </Button>
      </CardFooter>
    </Card>
  )
}

export function ClientsCards() {
  const router = useRouter()
  const db = useMockDb()
  const data = db.clients

  const [searchQuery, setSearchQuery] = React.useState("")
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = React.useState(false)
  const [isFiltersModalOpen, setIsFiltersModalOpen] = React.useState(false)
  const [viewClientId, setViewClientId] = React.useState<string | null>(null)

  const [filters, setFilters] = React.useState<ClientsFilters>({
    nameSort: "none",
    status: "",
    rep: "",
    homeType: "",
    roofType: "",
    leadSource: "",
    isInsuranceJob: false,
    isStormLead: false,
    isOverdueOnly: false,
    dateFrom: "",
    dateTo: "",
    tags: [] as string[],
  })

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 12,
  })

  const filteredData = React.useMemo(() => {
    return data.filter((client) => {
      const searchMatch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.phone && client.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        client.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase())

      const statusMatch = !filters.status || filters.status === "all" || client.status === filters.status
      const repMatch = !filters.rep || filters.rep === "all" || client.rep === filters.rep
      const homeTypeMatch = !filters.homeType || filters.homeType === "all" || client.homeType === filters.homeType
      const roofTypeMatch = !filters.roofType || filters.roofType === "all" || client.roofType === filters.roofType
      const leadSourceMatch =
        !filters.leadSource || filters.leadSource === "all" || client.leadSource === filters.leadSource

      const insuranceMatch = !filters.isInsuranceJob || client.carrier !== undefined
      const stormMatch = !filters.isStormLead || client.leadSource === "Storm"
      const overdueMatch = !filters.isOverdueOnly || client.status === "Overdue"

      let dateMatch = true
      if (filters.dateFrom || filters.dateTo) {
        dateMatch = true
      }

      const tagsMatch =
        filters.tags.length === 0 ||
        filters.tags.some((tag) => client.internalNotes?.toLowerCase().includes(tag.toLowerCase()))

      return (
        searchMatch &&
        statusMatch &&
        repMatch &&
        homeTypeMatch &&
        roofTypeMatch &&
        leadSourceMatch &&
        insuranceMatch &&
        stormMatch &&
        overdueMatch &&
        dateMatch &&
        tagsMatch
      )
    })
  }, [data, searchQuery, filters])

  const sortedData = React.useMemo(() => {
    if (filters.nameSort === "none") {
      return filteredData
    }
    const direction = filters.nameSort === "asc" ? 1 : -1
    return [...filteredData].sort((a, b) => a.name.localeCompare(b.name) * direction)
  }, [filteredData, filters.nameSort])

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [filters, searchQuery])

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pagination.pageSize))
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1)

  const pagedData = React.useMemo(() => {
    const start = pageIndex * pagination.pageSize
    const end = start + pagination.pageSize
    return sortedData.slice(start, end)
  }, [pageIndex, pagination.pageSize, sortedData])

  const selectedClient = React.useMemo(() => {
    if (!viewClientId) return null
    return data.find((c) => c.id === viewClientId) ?? null
  }, [data, viewClientId])

  const createEstimate = (clientId: string) => {
    setMockContext({ source: "clients", clientId })
    router.push("/dashboard/estimates/full")
  }

  const createInvoice = (clientId: string) => {
    setMockContext({ source: "clients", clientId })
    router.push("/dashboard/invoices/create")
  }

  const createProject = (clientId: string) => {
    setMockContext({ source: "clients", clientId })
    router.push("/dashboard/projects")
  }

  const handleClientAdded = (newClient: Client) => {
    const now = new Date().toISOString()
    setMockDb((prev) => ({
      ...prev,
      clients: upsertById(prev.clients, { ...newClient, updatedAt: now }),
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      nameSort: "none",
      status: "",
      rep: "",
      homeType: "",
      roofType: "",
      leadSource: "",
      isInsuranceJob: false,
      isStormLead: false,
      isOverdueOnly: false,
      dateFrom: "",
      dateTo: "",
      tags: [],
    })
  }

  const addTag = (tag: string) => {
    if (tag && !filters.tags.includes(tag)) {
      setFilters((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold shrink-0">Clients</h1>
          <p className="text-sm text-muted-foreground">Manage clients and take action without selecting rows.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsFiltersModalOpen(true)}>
            <IconFilter className="size-4" />
            <span className="hidden sm:inline">Filters</span>
            <IconChevronDown className="size-4" />
          </Button>
          <Button variant="outline" size="sm">
            <IconUpload className="size-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Button size="sm" onClick={() => setIsNewClientDialogOpen(true)}>
            <IconPlus className="size-4" />
            <span className="hidden sm:inline">Add New Client</span>
          </Button>
        </div>
      </div>

      <NewClientDialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen} onClientAdded={handleClientAdded} />

      <ClientDetailsDialog
        client={selectedClient}
        open={!!viewClientId}
        onOpenChange={(open) => setViewClientId(open ? viewClientId : null)}
        onCreateEstimate={() => (selectedClient ? createEstimate(selectedClient.id) : null)}
        onCreateInvoice={() => (selectedClient ? createInvoice(selectedClient.id) : null)}
        onCreateProject={() => (selectedClient ? createProject(selectedClient.id) : null)}
      />

      <div className="space-y-2">
        <Label htmlFor="search">Search Clients</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            type="search"
            placeholder="Search by name, phone, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {pagedData.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pagedData.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onView={() => setViewClientId(client.id)}
              onCreateEstimate={() => createEstimate(client.id)}
              onCreateInvoice={() => createInvoice(client.id)}
              onCreateProject={() => createProject(client.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">No results.</div>
      )}

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredData.length === 0 ? 0 : pageIndex * pagination.pageSize + 1}-
            {Math.min((pageIndex + 1) * pagination.pageSize, filteredData.length)}
          </span>{" "}
          of <span className="font-medium text-foreground">{filteredData.length}</span>
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Cards per page</p>
            <Select
              value={`${pagination.pageSize}`}
              onValueChange={(value) => setPagination((prev) => ({ ...prev, pageSize: Number(value) }))}
            >
              <SelectTrigger className="h-8 w-[84px]">
                <SelectValue placeholder={pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[12, 24, 36, 48].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-[120px] justify-center text-sm font-medium">
            Page {pageIndex + 1} of {pageCount}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setPagination((prev) => ({ ...prev, pageIndex: 0 }))}
              disabled={pageIndex === 0}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, pageIndex - 1) }))}
              disabled={pageIndex === 0}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setPagination((prev) => ({ ...prev, pageIndex: Math.min(pageCount - 1, pageIndex + 1) }))}
              disabled={pageIndex >= pageCount - 1}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setPagination((prev) => ({ ...prev, pageIndex: pageCount - 1 }))}
              disabled={pageIndex >= pageCount - 1}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isFiltersModalOpen} onOpenChange={setIsFiltersModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nameSort" className="mb-2">
                  Sort
                </Label>
                <Select
                  value={filters.nameSort}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, nameSort: value as ClientsFilters["nameSort"] }))}
                >
                  <SelectTrigger id="nameSort" className="w-full">
                    <SelectValue placeholder="No Sorting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Sorting</SelectItem>
                    <SelectItem value="asc">Name (A-Z)</SelectItem>
                    <SelectItem value="desc">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status" className="mb-2">
                  Status
                </Label>
                <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Any Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Status</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rep" className="mb-2">
                  Rep
                </Label>
                <Select value={filters.rep} onValueChange={(value) => setFilters((prev) => ({ ...prev, rep: value }))}>
                  <SelectTrigger id="rep" className="w-full">
                    <SelectValue placeholder="Any Rep" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Rep</SelectItem>
                    <SelectItem value="John Smith">John Smith</SelectItem>
                    <SelectItem value="Jane Doe">Jane Doe</SelectItem>
                    <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="homeType" className="mb-2">
                  Home Type
                </Label>
                <Select value={filters.homeType} onValueChange={(value) => setFilters((prev) => ({ ...prev, homeType: value }))}>
                  <SelectTrigger id="homeType" className="w-full">
                    <SelectValue placeholder="Any Home Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Home Type</SelectItem>
                    <SelectItem value="Single Family">Single Family</SelectItem>
                    <SelectItem value="Multi Family">Multi Family</SelectItem>
                    <SelectItem value="Condo">Condo</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="roofType" className="mb-2">
                  Roof Type
                </Label>
                <Select value={filters.roofType} onValueChange={(value) => setFilters((prev) => ({ ...prev, roofType: value }))}>
                  <SelectTrigger id="roofType" className="w-full">
                    <SelectValue placeholder="Any Roof Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Roof Type</SelectItem>
                    <SelectItem value="Asphalt Shingle">Asphalt Shingle</SelectItem>
                    <SelectItem value="Metal">Metal</SelectItem>
                    <SelectItem value="Tile">Tile</SelectItem>
                    <SelectItem value="Flat">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="leadSource" className="mb-2">
                  Lead Source
                </Label>
                <Select
                  value={filters.leadSource}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, leadSource: value }))}
                >
                  <SelectTrigger id="leadSource" className="w-full">
                    <SelectValue placeholder="Any Lead Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Lead Source</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Storm">Storm</SelectItem>
                    <SelectItem value="Cold Call">Cold Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Additional Filters</h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="insurance-job"
                  checked={filters.isInsuranceJob}
                  onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, isInsuranceJob: !!checked }))}
                />
                <Label htmlFor="insurance-job">Insurance Job</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="storm-lead"
                  checked={filters.isStormLead}
                  onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, isStormLead: !!checked }))}
                />
                <Label htmlFor="storm-lead">Storm Lead</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overdue-only"
                  checked={filters.isOverdueOnly}
                  onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, isOverdueOnly: !!checked }))}
                />
                <Label htmlFor="overdue-only">Overdue Only</Label>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Date Range</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date-from" className="mb-2">
                    From
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="date-to" className="mb-2">
                    To
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Tags</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {filters.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-1 text-muted-foreground hover:text-foreground">
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addTag(e.currentTarget.value)
                      e.currentTarget.value = ""
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Add tag..."]') as HTMLInputElement
                    if (input?.value) {
                      addTag(input.value)
                      input.value = ""
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={clearAllFilters}>
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsFiltersModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsFiltersModalOpen(false)}>Apply Filters</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


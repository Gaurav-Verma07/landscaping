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
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconUpload,
  IconFilter,
  IconX,
} from "@tabler/icons-react"
import { NewClientDialog } from "@/components/dashboard/clients/new-client-dialog"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Client } from "@/lib/mock/backend"
import { setMockContext, setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"

function ClientActionsCell({ clientId }: { clientId: string }) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
          size="icon"
        >
          <IconDotsVertical />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => router.push("/dashboard/clients")}>View client</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setMockContext({ source: "clients", clientId })
            router.push("/dashboard/estimates/full")
          }}
        >
          Create estimate
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setMockContext({ source: "clients", clientId })
            router.push("/dashboard/invoices/create")
          }}
        >
          Create invoice
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setMockContext({ source: "clients", clientId })
            router.push("/dashboard/projects")
          }}
        >
          New project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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

export interface ClientsTableProps {
  /**
   * Optional page-level chrome. Useful when the table is embedded in another layout.
   */
  showHeader?: boolean
  /**
   * Overrides the page title when showHeader is true.
   */
  title?: string
  /**
   * Overrides the page description when showHeader is true.
   */
  description?: string
  /**
   * Applies a starting search query.
   */
  initialSearchQuery?: string
  /**
   * Applies starting filters. Any omitted keys fall back to defaults.
   */
  initialFilters?: Partial<ClientsFilters>
  /**
   * Immediately opens the "New Client" dialog when mounted.
   */
  autoOpenNewClient?: boolean
}

type ClientRow = Client

const columns: ColumnDef<ClientRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <div className="text-sm">{row.original.phone || "-"}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="text-sm">{row.original.email || "-"}</div>,
  },
  {
    accessorKey: "leadSource",
    header: "Lead Source",
    cell: ({ row }) => <div className="text-sm">{row.original.leadSource || "-"}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
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
    },
  },
  {
    accessorKey: "propertyAddress",
    header: "Property Address",
    cell: ({ row }) => <div className="text-sm">{row.original.propertyAddress}</div>,
  },
  {
    accessorKey: "billingAddress",
    header: "Billing Address",
    cell: ({ row }) => <div className="text-sm">{row.original.billingAddress || "-"}</div>,
  },
  {
    accessorKey: "homeType",
    header: "Home Type",
    cell: ({ row }) => <div className="text-sm">{row.original.homeType || "-"}</div>,
  },
  {
    accessorKey: "roofType",
    header: "Roof Type",
    cell: ({ row }) => <div className="text-sm">{row.original.roofType || "-"}</div>,
  },
  {
    accessorKey: "roofAge",
    header: "Roof Age",
    cell: ({ row }) => <div className="text-sm">{row.original.roofAge ? `${row.original.roofAge} yrs` : "-"}</div>,
  },
  {
    accessorKey: "carrier",
    header: "Insurance Carrier",
    cell: ({ row }) => <div className="text-sm">{row.original.carrier || "-"}</div>,
  },
  {
    accessorKey: "policyNo",
    header: "Policy No.",
    cell: ({ row }) => <div className="text-sm font-mono">{row.original.policyNo || "-"}</div>,
  },
  {
    accessorKey: "claimNo",
    header: "Claim No.",
    cell: ({ row }) => <div className="text-sm font-mono">{row.original.claimNo || "-"}</div>,
  },
  {
    accessorKey: "adjusterName",
    header: "Adjuster Name",
    cell: ({ row }) => <div className="text-sm">{row.original.adjusterName || "-"}</div>,
  },
  {
    accessorKey: "adjusterPhone",
    header: "Adjuster Phone",
    cell: ({ row }) => <div className="text-sm">{row.original.adjusterPhone || "-"}</div>,
  },
  {
    accessorKey: "rep",
    header: "Rep",
    cell: ({ row }) => <div className="font-medium">{row.original.rep}</div>,
  },
  {
    accessorKey: "preferredContact",
    header: "Preferred Contact",
    cell: ({ row }) => <div className="text-sm">{row.original.preferredContact || "-"}</div>,
  },
  {
    accessorKey: "internalNotes",
    header: "Notes",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground max-w-xs truncate" title={row.original.internalNotes || ""}>
        {row.original.internalNotes || "-"}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ClientActionsCell clientId={row.original.id} />,
  },
]

export function ClientsTable({
  showHeader = true,
  title = "Clients",
  description,
  initialSearchQuery,
  initialFilters,
  autoOpenNewClient,
}: ClientsTableProps = {}) {
  const db = useMockDb()
  const data = db.clients
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    // Show only these 5 columns by default
    name: true,
    phone: true,
    email: true,
    status: true,
    propertyAddress: true,
    // Hide all other columns by default
    select: true, // Always show the selection checkbox
    leadSource: false,
    billingAddress: false,
    homeType: false,
    roofType: false,
    roofAge: false,
    carrier: false,
    policyNo: false,
    claimNo: false,
    adjusterName: false,
    adjusterPhone: false,
    rep: false,
    preferredContact: false,
    internalNotes: false,
    actions: true, // Always show the actions column
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery ?? "")
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = React.useState(!!autoOpenNewClient)
  const [isFiltersModalOpen, setIsFiltersModalOpen] = React.useState(false)
  
  // Filter states
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

  const [globalFilter, setGlobalFilter] = React.useState("")

  // Apply filters to data
  const filteredData = React.useMemo(() => {
    return data.filter((client) => {
      // Text search filter
      const searchMatch = 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.phone && client.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        client.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const statusMatch = !filters.status || filters.status === "all" || client.status === filters.status
      
      // Rep filter
      const repMatch = !filters.rep || filters.rep === "all" || client.rep === filters.rep
      
      // Home type filter
      const homeTypeMatch = !filters.homeType || filters.homeType === "all" || client.homeType === filters.homeType
      
      // Roof type filter
      const roofTypeMatch = !filters.roofType || filters.roofType === "all" || client.roofType === filters.roofType
      
      // Lead source filter
      const leadSourceMatch = !filters.leadSource || filters.leadSource === "all" || client.leadSource === filters.leadSource
      
      // Boolean filters
      const insuranceMatch = !filters.isInsuranceJob || client.carrier !== undefined
      const stormMatch = !filters.isStormLead || client.leadSource === "Storm"
      const overdueMatch = !filters.isOverdueOnly || client.status === "Overdue"
      
      // Date range filter
      let dateMatch = true
      if (filters.dateFrom || filters.dateTo) {
        // This would need actual date fields in the data
        // For now, we'll assume all records match
        dateMatch = true
      }
      
      // Tags filter
      const tagsMatch = filters.tags.length === 0 || 
        filters.tags.some(tag => 
          client.internalNotes?.toLowerCase().includes(tag.toLowerCase())
        )
      
      return searchMatch && statusMatch && repMatch && homeTypeMatch && 
             roofTypeMatch && leadSourceMatch && insuranceMatch && 
             stormMatch && overdueMatch && dateMatch && tagsMatch
    })
  }, [data, searchQuery, filters])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      rowSelection,
      columnFilters,
      columnVisibility,
      pagination,
      globalFilter,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    enableGlobalFilter: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toString().toLowerCase()
      const name = (row.getValue("name") as string)?.toLowerCase() || ""
      const phone = (row.getValue("phone") as string)?.toLowerCase() || ""
      const email = (row.getValue("email") as string)?.toLowerCase() || ""
      const address = (row.getValue("propertyAddress") as string)?.toLowerCase() || ""
      const rep = (row.getValue("rep") as string)?.toLowerCase() || ""
      const status = (row.getValue("status") as string)?.toLowerCase() || ""
      const leadSource = (row.getValue("leadSource") as string)?.toLowerCase() || ""
      const carrier = (row.getValue("carrier") as string)?.toLowerCase() || ""
      return (
        name.includes(search) ||
        phone.includes(search) ||
        email.includes(search) ||
        address.includes(search) ||
        rep.includes(search) ||
        status.includes(search) ||
        leadSource.includes(search) ||
        carrier.includes(search)
      )
    },
  })

  React.useEffect(() => {
    setGlobalFilter(searchQuery)
  }, [searchQuery])

  React.useEffect(() => {
    if (filters.nameSort === "asc") {
      setSorting([{ id: "name", desc: false }])
      return
    }
    if (filters.nameSort === "desc") {
      setSorting([{ id: "name", desc: true }])
      return
    }
    setSorting([])
  }, [filters.nameSort])

  // Apply initial filters/search once on mount (supports server navigation to filtered views)
  React.useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery)
    }
    if (initialFilters) {
      setFilters((prev) => ({ ...prev, ...initialFilters }))
    }
    if (autoOpenNewClient) {
      setIsNewClientDialogOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClientAdded = (newClient: Client) => {
    const now = new Date().toISOString()
    setMockDb((prev) => ({
      ...prev,
      clients: upsertById(prev.clients, { ...newClient, updatedAt: now }),
    }))
  }

  const quickActions = [
    { label: "View Profile", action: () => {} },
    { label: "Create Estimate", action: () => {} },
    { label: "New Project", action: () => {} },
    { label: "Send Invoice", action: () => {} },
    { label: "Upload Media", action: () => {} },
    { label: "Add Note", action: () => {} },
  ]

  const hasSelectedRows = Object.keys(rowSelection).length > 0

  // Reset pagination when filters change
  React.useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
  }, [filters, searchQuery])

  // Clear all filters
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

  // Add tag
  const addTag = (tag: string) => {
    if (tag && !filters.tags.includes(tag)) {
      setFilters(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    }
  }

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFilters(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }))
  }

  // Filters Modal Component
  const FiltersModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsFiltersModalOpen(false)}
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Dropdowns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nameSort" className="mb-2">Sort</Label>
              <Select value={filters.nameSort} onValueChange={(value) => setFilters(prev => ({ ...prev, nameSort: value as ClientsFilters["nameSort"] }))}>
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
              <Label htmlFor="status" className="mb-2">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
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
              <Label htmlFor="rep" className="mb-2">Rep</Label>
              <Select value={filters.rep} onValueChange={(value) => setFilters(prev => ({ ...prev, rep: value }))}>
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
              <Label htmlFor="homeType" className="mb-2">Home Type</Label>
              <Select value={filters.homeType} onValueChange={(value) => setFilters(prev => ({ ...prev, homeType: value }))}>
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
              <Label htmlFor="roofType" className="mb-2">Roof Type</Label>
              <Select value={filters.roofType} onValueChange={(value) => setFilters(prev => ({ ...prev, roofType: value }))}>
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
              <Label htmlFor="leadSource" className="mb-2">Lead Source</Label>
              <Select value={filters.leadSource} onValueChange={(value) => setFilters(prev => ({ ...prev, leadSource: value }))}>
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
          
          {/* Checkboxes */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Additional Filters</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="insurance-job" 
                checked={filters.isInsuranceJob}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isInsuranceJob: !!checked }))}
              />
              <Label htmlFor="insurance-job">Insurance Job</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="storm-lead" 
                checked={filters.isStormLead}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isStormLead: !!checked }))}
              />
              <Label htmlFor="storm-lead">Storm Lead</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="overdue-only" 
                checked={filters.isOverdueOnly}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isOverdueOnly: !!checked }))}
              />
              <Label htmlFor="overdue-only">Overdue Only</Label>
            </div>
          </div>
          
          {/* Date Range */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-from" className="mb-2">From</Label>
                <Input 
                  id="date-from" 
                  type="date" 
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="date-to" className="mb-2">To</Label>
                <Input 
                  id="date-to" 
                  type="date" 
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          {/* Tags */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {filters.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button 
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="Add tag..." 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTag(e.currentTarget.value)
                    e.currentTarget.value = ''
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
                    input.value = ''
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={clearAllFilters}>
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsFiltersModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsFiltersModalOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full space-y-4">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold shrink-0">{title}</h1>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns className="size-4" />
                  <span className="hidden lg:inline">Columns</span>
                  <IconChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" onCloseAutoFocus={(e) => e.preventDefault()}>
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                        onSelect={(e) => {
                          e.preventDefault()
                        }}
                      >
                        {column.id === "name"
                          ? "Name"
                          : column.id === "phone"
                          ? "Phone"
                          : column.id === "email"
                          ? "Email"
                          : column.id === "leadSource"
                          ? "Lead Source"
                          : column.id === "status"
                          ? "Status"
                          : column.id === "propertyAddress"
                          ? "Property Address"
                          : column.id === "billingAddress"
                          ? "Billing Address"
                          : column.id === "homeType"
                          ? "Home Type"
                          : column.id === "roofType"
                          ? "Roof Type"
                          : column.id === "roofAge"
                          ? "Roof Age"
                          : column.id === "carrier"
                          ? "Insurance Carrier"
                          : column.id === "policyNo"
                          ? "Policy No."
                          : column.id === "claimNo"
                          ? "Claim No."
                          : column.id === "adjusterName"
                          ? "Adjuster Name"
                          : column.id === "adjusterPhone"
                          ? "Adjuster Phone"
                          : column.id === "rep"
                          ? "Rep"
                          : column.id === "preferredContact"
                          ? "Preferred Contact"
                          : column.id === "internalNotes"
                          ? "Notes"
                          : column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
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
      )}

      <NewClientDialog
        open={isNewClientDialogOpen}
        onOpenChange={setIsNewClientDialogOpen}
        onClientAdded={handleClientAdded}
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

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted sticky top-0 z-20">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="px-2 py-3 whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-2 py-3 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <h3 className="text-sm font-medium mb-3">Client Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={action.action}
              className="text-xs"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isFiltersModalOpen && <FiltersModal />}
    </div>
  )
}


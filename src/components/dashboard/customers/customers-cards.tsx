"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconFilter,
  IconPlus,
  IconUpload,
} from "@tabler/icons-react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

import { NewCustomerDialog } from "@/components/dashboard/customers/new-customer-dialog"
import { ImportCustomersCsvDialog } from "@/components/dashboard/customers/import-customers-csv-dialog"
import { CustomerDetailsDialog } from "@/components/dashboard/customers/customer-details-dialog"
import { DeleteCustomerModal } from "@/components/dashboard/customers/delete-customer-modal"
import { MergeCustomerModal } from "@/components/dashboard/customers/merge-customer-modal"
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
import {
  Dialog,
  DialogContent,
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
import { useCustomerStore } from "@/lib/stores"
import type { Customer } from "@/types/customer-types"
import {
  CUSTOMER_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/types/customer-types"
import { toast } from "sonner"

type CustomersFilters = {
  nameSort: "none" | "asc" | "desc"
  status: string
  leadSource: string
}

function CustomerStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className="text-muted-foreground px-1.5">
      {CUSTOMER_STATUS_LABELS[status as keyof typeof CUSTOMER_STATUS_LABELS] ??
        status}
    </Badge>
  )
}

function CustomerCard({
  customer,
  onView,
  onEdit,
  onDelete,
}: {
  customer: Customer
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const router = useRouter()
  const subtitle =
    customer.companyName ||
    (customer.addresses?.length ? customer.addresses[0] : "—")
  const phone = customer.phones?.length ? customer.phones[0] : "—"
  const email = customer.emails?.length ? customer.emails[0] : "—"
  const leadLabel =
    LEAD_SOURCE_LABELS[customer.leadSource] ?? customer.leadSource ?? "—"

  return (
    <Card className="py-5">
      <CardHeader className="pb-2">
        <div className="min-w-0">
          <CardTitle className="truncate">
            {customer.name || "Unnamed customer"}
          </CardTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <CustomerStatusBadge status={customer.status} />
            <span className="text-xs text-muted-foreground truncate">
              {subtitle}
            </span>
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
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="truncate">
            <span className="text-muted-foreground">Phone: </span>
            {phone}
          </div>
          <div className="truncate">
            <span className="text-muted-foreground">Email: </span>
            {email}
          </div>
          <div className="truncate">
            <span className="text-muted-foreground">Lead: </span>
            {leadLabel}
          </div>
          <div className="truncate">
            <span className="text-muted-foreground">Status: </span>
            {CUSTOMER_STATUS_LABELS[customer.status as keyof typeof CUSTOMER_STATUS_LABELS] ?? customer.status}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onView}>
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/customers/${customer.id}/edit`)}
        >
          Edit
        </Button>
        <Button
          size="sm"
          onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
        >
          Full profile
        </Button>
      </CardFooter>
    </Card>
  )
}

export function CustomersCards() {
  const router = useRouter()
  const { customers, searchCustomers, getCustomer, deleteCustomer, loading: customersLoading } =
    useCustomerStore()

  const [searchQuery, setSearchQuery] = React.useState("")
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] =
    React.useState(false)
  const [isFiltersModalOpen, setIsFiltersModalOpen] = React.useState(false)
  const [viewCustomerId, setViewCustomerId] = React.useState<string | null>(
    null,
  )
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [customerToDelete, setCustomerToDelete] = React.useState<Customer | null>(
    null,
  )
  const [mergeOpen, setMergeOpen] = React.useState(false)
  const [mergeCustomerId, setMergeCustomerId] = React.useState<string | null>(
    null,
  )
  const [isImportCsvOpen, setIsImportCsvOpen] = React.useState(false)

  const [filters, setFilters] = React.useState<CustomersFilters>({
    nameSort: "none",
    status: "",
    leadSource: "",
  })

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 12,
  })

  const filteredData = React.useMemo(() => {
    let list = searchQuery.trim()
      ? searchCustomers(searchQuery)
      : customers
    if (filters.status && filters.status !== "all")
      list = list.filter((c) => c.status === filters.status)
    if (filters.leadSource && filters.leadSource !== "all")
      list = list.filter((c) => c.leadSource === filters.leadSource)
    return list
  }, [customers, searchQuery, filters, searchCustomers])

  const sortedData = React.useMemo(() => {
    if (filters.nameSort === "none") return filteredData
    const direction = filters.nameSort === "asc" ? 1 : -1
    return [...filteredData].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "") * direction,
    )
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

  const selectedCustomer = viewCustomerId ? getCustomer(viewCustomerId) ?? null : null

  const clearAllFilters = () => {
    setFilters({
      nameSort: "none",
      status: "",
      leadSource: "",
    })
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold shrink-0">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer records and take action without selecting rows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFiltersModalOpen(true)}
          >
            <IconFilter className="size-4" />
            <span className="hidden sm:inline">Filters</span>
            <IconChevronDown className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsImportCsvOpen(true)}>
            <IconUpload className="size-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Button size="sm" onClick={() => setIsNewCustomerDialogOpen(true)}>
            <IconPlus className="size-4" />
            <span className="hidden sm:inline">Add New Customer</span>
          </Button>
        </div>
      </div>

      <NewCustomerDialog
        open={isNewCustomerDialogOpen}
        onOpenChange={setIsNewCustomerDialogOpen}
      />

      <ImportCustomersCsvDialog
        open={isImportCsvOpen}
        onOpenChange={setIsImportCsvOpen}
      />

      <CustomerDetailsDialog
        customer={selectedCustomer}
        open={!!viewCustomerId}
        onOpenChange={(open) => !open && setViewCustomerId(null)}
        onMerge={(c) => {
          setViewCustomerId(null)
          setMergeCustomerId(c.id)
          setMergeOpen(true)
        }}
      />

      <DeleteCustomerModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open)
          if (!open) setCustomerToDelete(null)
        }}
        customer={customerToDelete}
        onConfirm={() => {
          if (customerToDelete) {
            deleteCustomer(customerToDelete.id)
            toast.success("Customer deleted.")
            setCustomerToDelete(null)
          }
        }}
      />

      <MergeCustomerModal
        open={mergeOpen}
        onOpenChange={(open) => {
          setMergeOpen(open)
          if (!open) setMergeCustomerId(null)
        }}
        currentCustomerId={mergeCustomerId ?? ""}
        onMerged={() => setMergeCustomerId(null)}
      />

      <div className="space-y-2">
        <Label htmlFor="search-customers">Search Customers</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search-customers"
            type="search"
            placeholder="Search by name, company, phone, email, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {customersLoading?
      (  <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Loading customers...
      </div>)
      : pagedData.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pagedData.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onView={() => setViewCustomerId(customer.id)}
              onEdit={() => router.push(`/dashboard/customers/${customer.id}/edit`)}
              onDelete={() => {
                setCustomerToDelete(customer)
                setDeleteModalOpen(true)
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No results.
        </div>
      )}

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredData.length === 0
              ? 0
              : pageIndex * pagination.pageSize + 1}-
            {Math.min(
              (pageIndex + 1) * pagination.pageSize,
              filteredData.length,
            )}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {filteredData.length}
          </span>
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Cards per page</p>
            <Select
              value={`${pagination.pageSize}`}
              onValueChange={(value) =>
                setPagination((prev) => ({ ...prev, pageSize: Number(value) }))
              }
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
              onClick={() =>
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }
              disabled={pageIndex === 0}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: Math.max(0, pageIndex - 1),
                }))
              }
              disabled={pageIndex === 0}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: Math.min(pageCount - 1, pageIndex + 1),
                }))
              }
              disabled={pageIndex >= pageCount - 1}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() =>
                setPagination((prev) => ({ ...prev, pageIndex: pageCount - 1 }))
              }
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
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      nameSort: value as CustomersFilters["nameSort"],
                    }))
                  }
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
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Any Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Status</SelectItem>
                    {Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="leadSource" className="mb-2">
                  Lead Source
                </Label>
                <Select
                  value={filters.leadSource}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, leadSource: value }))
                  }
                >
                  <SelectTrigger id="leadSource" className="w-full">
                    <SelectValue placeholder="Any Lead Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Lead Source</SelectItem>
                    {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={clearAllFilters}>
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFiltersModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setIsFiltersModalOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

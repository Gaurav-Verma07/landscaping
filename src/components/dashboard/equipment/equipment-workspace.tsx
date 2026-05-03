"use client"

import { useState, useMemo } from "react"
import {
  IconPlus,
  IconDotsVertical,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { useEquipmentStore } from "@/lib/stores"
import { useProjectStore } from "@/lib/stores"
import {
  EQUIPMENT_STATUS_LABELS,
  BOOKING_STATUS_LABELS,
  type EquipmentAsset,
  type EquipmentBooking,
  type EquipmentStatus,
  type BookingStatus,
} from "@/types/equipment-types"
import { toast } from "sonner"

const ASSET_STATUSES: EquipmentStatus[] = ["available", "in_use", "maintenance", "out_of_service"]

function AssetFormDialog({
  open,
  onOpenChange,
  asset,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: EquipmentAsset | null
}) {
  const { createAsset, updateAsset } = useEquipmentStore()
  const isEdit = !!asset
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [status, setStatus] = useState<EquipmentStatus>("available")
  const [notes, setNotes] = useState("")
  const [lastMaintenanceAt, setLastMaintenanceAt] = useState("")

  const reset = () => {
    setName("")
    setType("")
    setStatus("available")
    setNotes("")
    setLastMaintenanceAt("")
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    else if (asset) {
      setName(asset.name)
      setType(asset.type)
      setStatus(asset.status)
      setNotes(asset.notes)
      setLastMaintenanceAt(asset.lastMaintenanceAt?.slice(0, 10) ?? "")
    }
    onOpenChange(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name is required.")
      return
    }
    if (isEdit && asset) {
      updateAsset(asset.id, {
        name: name.trim(),
        type: type.trim(),
        status,
        notes: notes.trim(),
        lastMaintenanceAt: lastMaintenanceAt ? `${lastMaintenanceAt}T00:00:00.000Z` : null,
      })
      toast.success("Equipment updated.")
    } else {
      createAsset({
        name: name.trim(),
        type: type.trim(),
        status,
        notes: notes.trim(),
        lastMaintenanceAt: lastMaintenanceAt ? `${lastMaintenanceAt}T00:00:00.000Z` : null,
      })
      toast.success("Equipment added.")
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit equipment" : "Add equipment"}</DialogTitle>
        </DialogHeader>
        <form id="asset-form" onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Name *</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Truck A" />
          </Field>
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Truck, Mower" />
          </Field>
          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select value={status} onValueChange={(v) => setStatus(v as EquipmentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {EQUIPMENT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Last maintenance (date)</FieldLabel>
            <Input type="date" value={lastMaintenanceAt} onChange={(e) => setLastMaintenanceAt(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Notes</FieldLabel>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </Field>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="asset-form">
            {isEdit ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BookingFormDialog({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: EquipmentBooking | null
}) {
  const { assets, createBooking, updateBooking, getConflictingBookings } = useEquipmentStore()
  const { projects } = useProjectStore()
  const isEdit = !!booking
  const [assetId, setAssetId] = useState("")
  const [projectId, setProjectId] = useState<string>("none")
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [status, setStatus] = useState<BookingStatus>("scheduled")
  const [notes, setNotes] = useState("")

  const reset = () => {
    setAssetId("")
    setProjectId("none")
    setStartAt("")
    setEndAt("")
    setStatus("scheduled")
    setNotes("")
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    else if (booking) {
      setAssetId(booking.assetId)
      setProjectId(booking.projectId ?? "none")
      setStartAt(booking.startAt.slice(0, 16))
      setEndAt(booking.endAt.slice(0, 16))
      setStatus(booking.status)
      setNotes(booking.notes)
    }
    onOpenChange(next)
  }

  const handleSubmit = async(e: React.SubmitEvent) => {
    e.preventDefault()
    if (!assetId.trim()) {
      toast.error("Select equipment.")
      return
    }
    if (!startAt || !endAt) {
      toast.error("Enter start and end date/time.")
      return
    }
    const start = new Date(startAt)
    const end = new Date(endAt)
    if (end <= start) {
      toast.error("End must be after start.")
      return
    }
    const startIso = start.toISOString()
    const endIso = end.toISOString()
    const conflicts =await getConflictingBookings(assetId, startIso, endIso, isEdit ? booking?.id : undefined)
    if (conflicts.length > 0) {
      toast.warning(
        `This time slot overlaps with ${conflicts.length} existing booking(s) for this equipment. Consider choosing a different time or asset.`,
      )
    }
    if (isEdit && booking) {
      updateBooking(booking.id, {
        projectId: projectId === "none" ? null : projectId,
        startAt: startIso,
        endAt: endIso,
        status,
        notes: notes.trim(),
      })
      toast.success("Booking updated.")
    } else {
      createBooking({
        assetId,
        projectId: projectId === "none" ? null : projectId,
        appointmentId: null,
        startAt: startIso,
        endAt: endIso,
        status,
        notes: notes.trim(),
      })
      toast.success("Booking created.")
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit booking" : "Add booking"}</DialogTitle>
        </DialogHeader>
        <form id="booking-form" onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Equipment *</FieldLabel>
            <Select value={assetId} onValueChange={setAssetId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({EQUIPMENT_STATUS_LABELS[a.status]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Project</FieldLabel>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Start *</FieldLabel>
            <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel>End *</FieldLabel>
            <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
          </Field>
          {isEdit && (
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["scheduled", "in_use", "completed", "cancelled"] as const).map((s) => (
                    <SelectItem key={s} value={s}>
                      {BOOKING_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field>
            <FieldLabel>Notes</FieldLabel>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </Field>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="booking-form">
            {isEdit ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EquipmentWorkspace() {
  const {
    assets,
    bookings,
    deleteAsset,
    deleteBooking,
    updateBooking,
    loading: equipmentLoading
  } = useEquipmentStore()
  const { getProject } = useProjectStore()
  const [assetFormOpen, setAssetFormOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<EquipmentAsset | null>(null)
  const [bookingFormOpen, setBookingFormOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<EquipmentBooking | null>(null)
  const [bookingPage, setBookingPage] = useState(0)
  const bookingPageSize = 10

  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status !== "cancelled").sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()),
    [bookings],
  )
  const totalAvailable = assets.filter((a) => a.status === "available").length
  const totalInUse = assets.filter((a) => a.status === "in_use").length
  const bookingPageCount = Math.max(1, Math.ceil(activeBookings.length / bookingPageSize))
  const bookingPageIndex = Math.min(bookingPage, bookingPageCount - 1)
  const pagedBookings = useMemo(
    () => activeBookings.slice(bookingPageIndex * bookingPageSize, (bookingPageIndex + 1) * bookingPageSize),
    [activeBookings, bookingPageIndex, bookingPageSize],
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipment & Truck Scheduling</h1>
          <p className="text-muted-foreground text-sm">
            Registry, availability, and bookings. Conflict detection when the same asset is double-booked.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditingBooking(null); setBookingFormOpen(true) }}>
            <IconPlus className="mr-2 size-4" />
            Add booking
          </Button>
          <Button size="sm" onClick={() => { setEditingAsset(null); setAssetFormOpen(true) }}>
            <IconPlus className="mr-2 size-4" />
            Add equipment
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAvailable}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">In use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInUse}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBookings.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipment registry</CardTitle>
        </CardHeader>
        <CardContent>
          {equipmentLoading?
          <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
          Loading equipments...
        </div>
           :assets.length !== 0 ?(
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last maintenance</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.type || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "available" ? "default" : "secondary"}>
                        {EQUIPMENT_STATUS_LABELS[a.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{a.lastMaintenanceAt ? new Date(a.lastMaintenanceAt).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingAsset(a); setAssetFormOpen(true) }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              deleteAsset(a.id)
                              toast.success("Equipment removed.")
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
          : (
            <p className="text-sm text-muted-foreground py-6 text-center">No equipment yet. Add an asset to get started.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {activeBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No bookings yet. Add a booking to reserve equipment.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedBookings.map((b) => {
                    const asset = assets.find((x) => x.id === b.assetId)
                    const project = b.projectId ? getProject(b.projectId) : null
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{asset?.name ?? b.assetId}</TableCell>
                        <TableCell>{project?.name ?? "—"}</TableCell>
                        <TableCell>{new Date(b.startAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</TableCell>
                        <TableCell>{new Date(b.endAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{BOOKING_STATUS_LABELS[b.status]}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <IconDotsVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingBooking(b); setBookingFormOpen(true) }}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { updateBooking(b.id, { status: "completed" }); toast.success("Marked completed.") }}>
                                Mark completed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { updateBooking(b.id, { status: "cancelled" }); toast.success("Booking cancelled.") }}>
                                Cancel
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  deleteBooking(b.id)
                                  toast.success("Booking removed.")
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Showing {activeBookings.length === 0 ? 0 : bookingPageIndex * bookingPageSize + 1}–
                  {Math.min((bookingPageIndex + 1) * bookingPageSize, activeBookings.length)} of {activeBookings.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setBookingPage(0)} disabled={bookingPageIndex === 0} aria-label="First page">
                    <IconChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setBookingPage((p) => Math.max(0, p - 1))} disabled={bookingPageIndex === 0} aria-label="Previous">
                    <IconChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setBookingPage((p) => Math.min(bookingPageCount - 1, p + 1))} disabled={bookingPageIndex >= bookingPageCount - 1} aria-label="Next">
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setBookingPage(bookingPageCount - 1)} disabled={bookingPageIndex >= bookingPageCount - 1} aria-label="Last page">
                    <IconChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AssetFormDialog open={assetFormOpen} onOpenChange={setAssetFormOpen} asset={editingAsset} />
      <BookingFormDialog open={bookingFormOpen} onOpenChange={setBookingFormOpen} booking={editingBooking} />
    </div>
  )
}

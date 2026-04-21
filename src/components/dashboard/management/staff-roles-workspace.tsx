"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Plus } from "lucide-react"

import type { StaffUser } from "@/lib/mock/backend"
import { newId, removeById, setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDialog } from "@/components/dashboard/invoices/shared/confirm-dialog"

function roleBadge(roleName: string) {
  const key = roleName.toLowerCase()
  if (key.includes("admin")) return <Badge variant="secondary">admin</Badge>
  if (key.includes("owner")) return <Badge>owner</Badge>
  if (key.includes("sales")) return <Badge variant="outline">sales</Badge>
  if (key.includes("account")) return <Badge variant="outline">accounting</Badge>
  return <Badge variant="outline">{roleName}</Badge>
}

export function StaffRolesWorkspace() {
  const db = useMockDb()
  const roles = db.management.roles
  const users = db.management.users

  const [query, setQuery] = useState("")
  const [roleId, setRoleId] = useState<string | "all">("all")

  const [upsertOpen, setUpsertOpen] = useState(false)
  const [active, setActive] = useState<StaffUser | null>(null)
  const [disableOpen, setDisableOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      const matchesText = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      const matchesRole = roleId === "all" ? true : u.roleId === roleId
      return matchesText && matchesRole
    })
  }, [users, query, roleId])

  const stats = useMemo(() => {
    const activeCount = users.filter((u) => u.active).length
    const twoFa = users.filter((u) => u.twoFactorEnabled).length
    return { activeCount, twoFa }
  }, [users])

  const beginAdd = () => {
    const now = new Date().toISOString()
    const role = roles[0]
    setActive({
      id: newId("user"),
      name: "",
      email: "",
      roleId: role?.id ?? "role-admin",
      roleName: role?.name ?? "Admin",
      active: true,
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    })
    setUpsertOpen(true)
  }

  const beginEdit = (u: StaffUser) => {
    setActive({ ...u })
    setUpsertOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff & Roles</h1>
          <p className="text-muted-foreground">Users, access, and basic security settings (mock DB backed).</p>
        </div>
        <Button onClick={beginAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add user
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <div className="text-xs text-muted-foreground">Enabled accounts</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">2FA enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.twoFa}</div>
            <div className="text-xs text-muted-foreground">Best practice for admins/accounting</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Directory</CardTitle>
          <CardDescription>Search and filter staff. Edit and disable users.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="sr-only" htmlFor="staff-q">
                Search
              </Label>
              <Input id="staff-q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email..." />
            </div>
            <div>
              <Label className="sr-only">Role</Label>
              <Select value={roleId} onValueChange={(v) => setRoleId(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-end text-sm text-muted-foreground">{filtered.length} users</div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-auto">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="px-2 py-3">User</TableHead>
                    <TableHead className="px-2 py-3">Role</TableHead>
                    <TableHead className="px-2 py-3">Active</TableHead>
                    <TableHead className="px-2 py-3">2FA</TableHead>
                    <TableHead className="w-32 px-2 py-3"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length ? (
                    filtered.map((u) => (
                      <TableRow key={u.id} className="hover:bg-muted/50">
                        <TableCell className="px-2 py-3">
                          <div className="font-medium">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </TableCell>
                        <TableCell className="px-2 py-3">{roleBadge(u.roleName)}</TableCell>
                        <TableCell className="px-2 py-3">{u.active ? <Badge variant="secondary">active</Badge> : <Badge variant="outline">disabled</Badge>}</TableCell>
                        <TableCell className="px-2 py-3">{u.twoFactorEnabled ? <Badge>enabled</Badge> : <Badge variant="outline">off</Badge>}</TableCell>
                        <TableCell className="px-2 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => beginEdit(u)}>
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActive(u)
                                setDisableOpen(true)
                              }}
                              disabled={!u.active}
                            >
                              Disable
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={upsertOpen} onOpenChange={setUpsertOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{active?.name ? "Edit user" : "Add user"}</DialogTitle>
            <DialogDescription>Changes are stored in the unified mock DB (localStorage).</DialogDescription>
          </DialogHeader>

          {active ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="u-name">Name</Label>
                <Input id="u-name" value={active.name} onChange={(e) => setActive({ ...active, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="u-email">Email</Label>
                <Input id="u-email" value={active.email} onChange={(e) => setActive({ ...active, email: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={active.roleId}
                  onValueChange={(v) => {
                    const role = roles.find((r) => r.id === v)
                    setActive({ ...active, roleId: v, roleName: role?.name ?? active.roleName })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label>Active</Label>
                  <div className="text-xs text-muted-foreground">Disable to revoke access without deleting history.</div>
                </div>
                <Switch checked={active.active} onCheckedChange={(v) => setActive({ ...active, active: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label>Two-factor auth</Label>
                  <div className="text-xs text-muted-foreground">Recommended for admin/accounting roles.</div>
                </div>
                <Switch checked={active.twoFactorEnabled} onCheckedChange={(v) => setActive({ ...active, twoFactorEnabled: v })} />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpsertOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!active) return
                if (!active.name.trim() || !active.email.trim()) return
                const now = new Date().toISOString()
                const toSave: StaffUser = { ...active, name: active.name.trim(), email: active.email.trim(), updatedAt: now }
                setMockDb((prev) => ({
                  ...prev,
                  management: { ...prev.management, users: upsertById(prev.management.users, toSave) },
                }))
                setUpsertOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={disableOpen}
        onOpenChange={setDisableOpen}
        title="Disable user?"
        description="This will revoke access while keeping history (mock DB)."
        confirmLabel="Disable"
        onConfirm={() => {
          if (!active) return
          const now = new Date().toISOString()
          setMockDb((prev) => {
            const current = prev.management.users.find((u) => u.id === active.id)
            if (!current) return prev
            return {
              ...prev,
              management: {
                ...prev.management,
                users: upsertById(prev.management.users, { ...current, active: false, updatedAt: now }),
              },
            }
          })
          setDisableOpen(false)
          setActive(null)
        }}
      />
    </div>
  )
}


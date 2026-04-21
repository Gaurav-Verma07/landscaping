"use client"

import * as React from "react"
import { useEffect, useState } from "react"

import type { LaborRate } from "@/types/invoice.types"
import { mockCrewAssignments, mockRoles } from "@/lib/mock/invoice-mock-data"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type RateType = "hourly" | "daily" | "fixed"

export function LaborRateUpsertDialog({
  open,
  onOpenChange,
  rate,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rate: LaborRate | null
  onSave: (rate: LaborRate) => void
}) {
  const isEdit = !!rate

  const [roleId, setRoleId] = useState("")
  const [roleName, setRoleName] = useState("")
  const [rateType, setRateType] = useState<RateType>("hourly")
  const [baseRate, setBaseRate] = useState("0")
  const [overtimeRate, setOvertimeRate] = useState("0")
  const [defaultCrew, setDefaultCrew] = useState<string>("")

  useEffect(() => {
    if (!open) return
    if (rate) {
      setRoleId(rate.roleId)
      setRoleName(rate.roleName)
      setRateType(rate.rateType)
      setBaseRate(String(rate.rate))
      setOvertimeRate(String(rate.overtimeRate ?? 0))
      setDefaultCrew(rate.defaultCrew?.[0] ?? "")
    } else {
      const firstRole = mockRoles[0]
      setRoleId(firstRole?.id ?? "")
      setRoleName(firstRole?.name ?? "")
      setRateType("hourly")
      setBaseRate("0")
      setOvertimeRate("0")
      setDefaultCrew("")
    }
  }, [open, rate])

  const canSave = roleName.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit labor rate" : "Add labor rate"}</DialogTitle>
          <DialogDescription>
            Set default rates by role. Crew defaults are optional.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select
              value={roleId}
              onValueChange={(v) => {
                setRoleId(v)
                const r = mockRoles.find((x) => x.id === v)
                setRoleName(r?.name ?? roleName)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {mockRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Rate type</Label>
              <Select value={rateType} onValueChange={(v) => setRateType(v as RateType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate-base">Rate</Label>
              <Input id="rate-base" inputMode="decimal" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="rate-ot">Overtime rate (optional)</Label>
              <Input id="rate-ot" inputMode="decimal" value={overtimeRate} onChange={(e) => setOvertimeRate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Default crew (optional)</Label>
              <Select value={defaultCrew} onValueChange={setDefaultCrew}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {mockCrewAssignments.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              const toSave: LaborRate = {
                id: rate?.id ?? `rate-${Math.random().toString(16).slice(2, 8)}`,
                roleId: roleId || "role-custom",
                roleName: roleName.trim(),
                rateType,
                rate: Number(baseRate) || 0,
                overtimeRate: Number(overtimeRate) || undefined,
                defaultCrew: defaultCrew ? [defaultCrew] : [],
                overtimeRules: rate?.overtimeRules,
              }
              onSave(toSave)
              onOpenChange(false)
            }}
          >
            {isEdit ? "Save changes" : "Add rate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


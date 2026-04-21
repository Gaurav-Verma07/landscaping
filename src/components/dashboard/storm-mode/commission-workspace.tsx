"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Calculator, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { CommissionPlan } from "@/lib/mock/backend"
import { newId, setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

export function StormCommissionWorkspace() {
  const db = useMockDb()
  const plans = db.storm.commissionPlans
  const [planId, setPlanId] = useState<string>(plans[0]?.id ?? "")

  const [jobTotal, setJobTotal] = useState("15000")
  const [isStormJob, setIsStormJob] = useState<"yes" | "no">("yes")
  const [supplement, setSupplement] = useState("0")

  const [newOpen, setNewOpen] = useState(false)
  const [newPlan, setNewPlan] = useState<CommissionPlan>({
    id: "",
    name: "",
    basePct: 8,
    stormBonusPct: 2,
    supplementPct: 5,
    minimumPayout: 250,
    active: true,
    updatedAt: new Date().toISOString(),
  })

  const activePlan = useMemo(() => plans.find((p) => p.id === planId) ?? plans[0] ?? null, [plans, planId])

  const calc = useMemo(() => {
    const total = Number(jobTotal) || 0
    const supp = Number(supplement) || 0
    const base = total * ((activePlan?.basePct ?? 0) / 100)
    const stormBonus = isStormJob === "yes" ? total * ((activePlan?.stormBonusPct ?? 0) / 100) : 0
    const suppPay = supp * ((activePlan?.supplementPct ?? 0) / 100)
    const raw = base + stormBonus + suppPay
    const payout = Math.max(activePlan?.minimumPayout ?? 0, raw)
    return { total, supp, base, stormBonus, suppPay, raw, payout }
  }, [jobTotal, supplement, activePlan, isStormJob])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Calculator</h1>
          <p className="text-muted-foreground">
            Standardize storm commissions across roofing teams (base %, storm bonus, supplements).
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setNewPlan({
              id: newId("plan"),
              name: "",
              basePct: 8,
              stormBonusPct: 2,
              supplementPct: 5,
              minimumPayout: 250,
              active: true,
              updatedAt: new Date().toISOString(),
            })
            setNewOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add plan
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Quick calc
              </CardTitle>
              <CardDescription>Use during storms to quote payouts consistently.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Plan</Label>
                  <Select value={planId} onValueChange={setPlanId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Storm job?</Label>
                  <Select value={isStormJob} onValueChange={(v) => setIsStormJob(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="job-total">Job total (contract)</Label>
                  <Input id="job-total" inputMode="decimal" value={jobTotal} onChange={(e) => setJobTotal(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supp">Supplement amount</Label>
                  <Input id="supp" inputMode="decimal" value={supplement} onChange={(e) => setSupplement(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Plans</CardTitle>
              <CardDescription>Starter plans. In production these would be company-wide settings.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">Storm</TableHead>
                      <TableHead className="text-right">Supp</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((p) => (
                      <TableRow key={p.id} className={p.id === planId ? "bg-muted/30" : ""}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">{p.basePct}%</TableCell>
                        <TableCell className="text-right">{p.stormBonusPct}%</TableCell>
                        <TableCell className="text-right">{p.supplementPct}%</TableCell>
                        <TableCell className="text-right">{money(p.minimumPayout)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Payout breakdown</CardTitle>
                <CardDescription>{activePlan?.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Base</span>
                  <span className="font-medium">{money(calc.base)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Storm bonus</span>
                  <span className="font-medium">{money(calc.stormBonus)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Supplement payout</span>
                  <span className="font-medium">{money(calc.suppPay)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Raw</span>
                  <span className="font-medium">{money(calc.raw)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Min payout</span>
                  <span className="font-medium">{money(activePlan?.minimumPayout ?? 0)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Final payout</span>
                  <span className="text-xl font-semibold">{money(calc.payout)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Notes</CardTitle>
                <CardDescription>Roofing-storm reality</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Most roofing orgs separate payouts for contract vs supplements. This calculator supports both, plus a storm bonus and a minimum floor.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add commission plan</DialogTitle>
            <DialogDescription>Create a default plan for your team.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="plan-name">Name</Label>
              <Input id="plan-name" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="base-pct">Base %</Label>
                <Input id="base-pct" inputMode="decimal" value={String(newPlan.basePct)} onChange={(e) => setNewPlan({ ...newPlan, basePct: Number(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="storm-pct">Storm bonus %</Label>
                <Input id="storm-pct" inputMode="decimal" value={String(newPlan.stormBonusPct)} onChange={(e) => setNewPlan({ ...newPlan, stormBonusPct: Number(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="supp-pct">Supplement %</Label>
                <Input id="supp-pct" inputMode="decimal" value={String(newPlan.supplementPct)} onChange={(e) => setNewPlan({ ...newPlan, supplementPct: Number(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="min-pay">Minimum payout</Label>
                <Input
                  id="min-pay"
                  inputMode="decimal"
                  value={String(newPlan.minimumPayout)}
                  onChange={(e) => setNewPlan({ ...newPlan, minimumPayout: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newPlan.name.trim()) return
                const now = new Date().toISOString()
                const toSave: CommissionPlan = { ...newPlan, name: newPlan.name.trim(), updatedAt: now }
                setMockDb((prev) => ({
                  ...prev,
                  storm: { ...prev.storm, commissionPlans: upsertById(prev.storm.commissionPlans, toSave) },
                }))
                setPlanId(newPlan.id)
                setNewOpen(false)
              }}
            >
              Add plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


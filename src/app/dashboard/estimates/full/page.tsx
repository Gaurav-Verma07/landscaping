"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import {
  Calculator,
  ClipboardList,
  DollarSign,
  Home,
  Percent,
  Ruler,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { clearMockContext, readMockContext } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"

type Difficulty = "easy" | "standard" | "steep" | "complex"
type ShingleType = "architectural" | "three-tab" | "premium"
type TaxMode = "materials_only" | "subtotal"

type LineItem = {
  key: string
  name: string
  unit?: string
  qty?: number
  rate?: number
  total: number
  category: "materials" | "labor" | "overhead" | "fees"
}

function num(v: string) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function pitchMultiplier(pitch: number) {
  // pitch is rise per 12 (e.g., 6 means 6/12). slope factor = sqrt(1 + (rise/run)^2)
  const r = pitch / 12
  return Math.sqrt(1 + r * r)
}

export default function FullEstimatePage() {
  const db = useMockDb()
  const [jobName, setJobName] = useState("Roof Replacement")
  const [address, setAddress] = useState("")

  React.useEffect(() => {
    const ctx = readMockContext()
    if (!ctx) return
    const client = ctx.clientId ? db.clients.find((c) => c.id === ctx.clientId) : undefined
    const project = ctx.projectId ? db.projects.find((p) => p.id === ctx.projectId) : undefined
    if (project?.name) setJobName(project.name)
    else if (client?.name) setJobName(`Roof Estimate - ${client.name}`)
    if (project?.location) setAddress(project.location)
    else if (client?.propertyAddress) setAddress(client.propertyAddress)
    clearMockContext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Measurements (simple but roofing-relevant)
  const [buildingFootprintSqft, setBuildingFootprintSqft] = useState("2000")
  const [pitch, setPitch] = useState("6") // rise per 12
  const [wastePct, setWastePct] = useState("12")

  // Linear footage / counts for common accessories
  const [eaveLf, setEaveLf] = useState("160")
  const [rakeLf, setRakeLf] = useState("120")
  const [ridgeLf, setRidgeLf] = useState("45")
  const [pipeBootsCount, setPipeBootsCount] = useState("4")
  const [ventsCount, setVentsCount] = useState("2")

  // Options
  const [difficulty, setDifficulty] = useState<Difficulty>("standard")
  const [tearOffLayers, setTearOffLayers] = useState("1")
  const [shingleType, setShingleType] = useState<ShingleType>("architectural")
  const [includeIceWater, setIncludeIceWater] = useState(true)
  const [iceWaterCourses, setIceWaterCourses] = useState("2") // 3ft courses

  // Pricing knobs (defaults can be tuned later)
  const [laborPerSquare, setLaborPerSquare] = useState("140")
  const [tearOffPerSquarePerLayer, setTearOffPerSquarePerLayer] = useState("45")
  const [dumpsterFee, setDumpsterFee] = useState("650")
  const [permitFee, setPermitFee] = useState("150")

  const [overheadPct, setOverheadPct] = useState("12")
  const [profitPct, setProfitPct] = useState("25")
  const [discount, setDiscount] = useState("0")
  const [taxPct, setTaxPct] = useState("0")
  const [taxMode, setTaxMode] = useState<TaxMode>("materials_only")

  const difficultyFactor = useMemo(() => {
    switch (difficulty) {
      case "easy":
        return 0.9
      case "standard":
        return 1.0
      case "steep":
        return 1.25
      case "complex":
        return 1.45
      default:
        return 1.0
    }
  }, [difficulty])

  const shingleMaterialPerSquare = useMemo(() => {
    // Materials only (shingles). Labor handled separately.
    switch (shingleType) {
      case "three-tab":
        return 115
      case "architectural":
        return 155
      case "premium":
        return 225
      default:
        return 155
    }
  }, [shingleType])

  const derived = useMemo(() => {
    const footprint = clamp(num(buildingFootprintSqft), 0, 1_000_000)
    const pitchN = clamp(num(pitch), 0, 24)
    const waste = clamp(num(wastePct), 0, 40) / 100

    const slope = pitchMultiplier(pitchN)
    const roofArea = footprint * slope
    const roofAreaWithWaste = roofArea * (1 + waste)
    const squares = roofAreaWithWaste / 100

    const eave = clamp(num(eaveLf), 0, 50_000)
    const rake = clamp(num(rakeLf), 0, 50_000)
    const ridge = clamp(num(ridgeLf), 0, 50_000)

    const dripEdgeLf = eave + rake
    const starterLf = eave + rake

    const boots = clamp(num(pipeBootsCount), 0, 200)
    const vents = clamp(num(ventsCount), 0, 200)

    const layers = clamp(num(tearOffLayers), 0, 5)
    const courses = clamp(num(iceWaterCourses), 0, 4)

    // Ice & water area approximation: eave length * 3ft per course
    const iceWaterSqft = includeIceWater ? eave * 3 * courses : 0

    return {
      slope,
      roofArea,
      roofAreaWithWaste,
      squares,
      dripEdgeLf,
      starterLf,
      ridgeLf: ridge,
      boots,
      vents,
      layers,
      iceWaterSqft,
    }
  }, [
    buildingFootprintSqft,
    pitch,
    wastePct,
    eaveLf,
    rakeLf,
    ridgeLf,
    pipeBootsCount,
    ventsCount,
    tearOffLayers,
    includeIceWater,
    iceWaterCourses,
  ])

  const lineItems = useMemo<LineItem[]>(() => {
    const items: LineItem[] = []

    const squares = derived.squares
    const tearOffRate = num(tearOffPerSquarePerLayer)
    const laborRate = num(laborPerSquare)

    // Materials (starter defaults)
    const underlaymentPerSquare = 22
    const starterPerLf = 1.2
    const dripEdgePerLf = 2.1
    const ridgeCapPerLf = 4.25
    const iceWaterPerSqft = 0.85
    const bootsEach = 55
    const ventsEach = 95
    const nailsPerSquare = 6

    // Tear-off
    if (derived.layers > 0 && tearOffRate > 0) {
      items.push({
        key: "tearoff",
        name: "Tear-off & disposal labor",
        unit: "sq",
        qty: squares,
        rate: tearOffRate * derived.layers * difficultyFactor,
        total: squares * tearOffRate * derived.layers * difficultyFactor,
        category: "labor",
      })
    }

    // Dumpster
    if (num(dumpsterFee) > 0) {
      items.push({
        key: "dumpster",
        name: "Dumpster / dump fees",
        total: num(dumpsterFee),
        category: "fees",
      })
    }

    // Shingles
    items.push({
      key: "shingles",
      name: "Shingles (material)",
      unit: "sq",
      qty: squares,
      rate: shingleMaterialPerSquare,
      total: squares * shingleMaterialPerSquare,
      category: "materials",
    })

    // Underlayment
    items.push({
      key: "underlayment",
      name: "Synthetic underlayment",
      unit: "sq",
      qty: squares,
      rate: underlaymentPerSquare,
      total: squares * underlaymentPerSquare,
      category: "materials",
    })

    // Ice & water
    if (derived.iceWaterSqft > 0) {
      items.push({
        key: "icewater",
        name: "Ice & water shield",
        unit: "sqft",
        qty: derived.iceWaterSqft,
        rate: iceWaterPerSqft,
        total: derived.iceWaterSqft * iceWaterPerSqft,
        category: "materials",
      })
    }

    // Drip edge
    items.push({
      key: "dripedge",
      name: "Drip edge",
      unit: "lf",
      qty: derived.dripEdgeLf,
      rate: dripEdgePerLf,
      total: derived.dripEdgeLf * dripEdgePerLf,
      category: "materials",
    })

    // Starter
    items.push({
      key: "starter",
      name: "Starter strip",
      unit: "lf",
      qty: derived.starterLf,
      rate: starterPerLf,
      total: derived.starterLf * starterPerLf,
      category: "materials",
    })

    // Ridge cap
    if (derived.ridgeLf > 0) {
      items.push({
        key: "ridgecap",
        name: "Ridge cap",
        unit: "lf",
        qty: derived.ridgeLf,
        rate: ridgeCapPerLf,
        total: derived.ridgeLf * ridgeCapPerLf,
        category: "materials",
      })
    }

    // Pipe boots & vents
    if (derived.boots > 0) {
      items.push({
        key: "boots",
        name: "Pipe boots / flashings",
        unit: "ea",
        qty: derived.boots,
        rate: bootsEach,
        total: derived.boots * bootsEach,
        category: "materials",
      })
    }
    if (derived.vents > 0) {
      items.push({
        key: "vents",
        name: "Roof vents / ventilation",
        unit: "ea",
        qty: derived.vents,
        rate: ventsEach,
        total: derived.vents * ventsEach,
        category: "materials",
      })
    }

    // Nails & misc
    items.push({
      key: "nails",
      name: "Nails / fasteners",
      unit: "sq",
      qty: squares,
      rate: nailsPerSquare,
      total: squares * nailsPerSquare,
      category: "materials",
    })

    // Labor
    if (laborRate > 0) {
      items.push({
        key: "labor",
        name: "Install labor",
        unit: "sq",
        qty: squares,
        rate: laborRate * difficultyFactor,
        total: squares * laborRate * difficultyFactor,
        category: "labor",
      })
    }

    // Permit
    if (num(permitFee) > 0) {
      items.push({
        key: "permit",
        name: "Permit / inspection fees",
        total: num(permitFee),
        category: "fees",
      })
    }

    return items.filter((i) => Number.isFinite(i.total) && i.total !== 0)
  }, [
    derived,
    difficultyFactor,
    shingleMaterialPerSquare,
    tearOffPerSquarePerLayer,
    laborPerSquare,
    dumpsterFee,
    permitFee,
  ])

  const totals = useMemo(() => {
    const materials = lineItems.filter((i) => i.category === "materials").reduce((a, i) => a + i.total, 0)
    const labor = lineItems.filter((i) => i.category === "labor").reduce((a, i) => a + i.total, 0)
    const fees = lineItems.filter((i) => i.category === "fees").reduce((a, i) => a + i.total, 0)
    const subtotal = materials + labor + fees

    const overhead = subtotal * (clamp(num(overheadPct), 0, 40) / 100)
    const beforeProfit = subtotal + overhead
    const profit = beforeProfit * (clamp(num(profitPct), 0, 80) / 100)

    const taxBase = taxMode === "materials_only" ? materials : beforeProfit + profit
    const tax = taxBase * (clamp(num(taxPct), 0, 15) / 100)

    const disc = clamp(num(discount), 0, 1_000_000)

    const total = beforeProfit + profit + tax - disc

    return {
      materials,
      labor,
      fees,
      subtotal,
      overhead,
      profit,
      tax,
      discount: disc,
      total: Math.max(0, total),
      costPerSq: derived.squares > 0 ? Math.max(0, total) / derived.squares : 0,
      costPerSqft: derived.roofAreaWithWaste > 0 ? Math.max(0, total) / derived.roofAreaWithWaste : 0,
    }
  }, [lineItems, overheadPct, profitPct, taxPct, taxMode, discount, derived.squares, derived.roofAreaWithWaste])

  const resetToDefaults = () => {
    setJobName("Roof Replacement")
    setAddress("")
    setBuildingFootprintSqft("2000")
    setPitch("6")
    setWastePct("12")
    setEaveLf("160")
    setRakeLf("120")
    setRidgeLf("45")
    setPipeBootsCount("4")
    setVentsCount("2")
    setDifficulty("standard")
    setTearOffLayers("1")
    setShingleType("architectural")
    setIncludeIceWater(true)
    setIceWaterCourses("2")
    setLaborPerSquare("140")
    setTearOffPerSquarePerLayer("45")
    setDumpsterFee("650")
    setPermitFee("150")
    setOverheadPct("12")
    setProfitPct("25")
    setDiscount("0")
    setTaxPct("0")
    setTaxMode("materials_only")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Full Estimate</h1>
          <p className="text-muted-foreground">
            Roofing-specific estimate builder with real line items and totals.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <Trash2 className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button>
            <ClipboardList className="mr-2 h-4 w-4" />
            Save estimate (stub)
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Inputs */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Job details
              </CardTitle>
              <CardDescription>Basic information for the estimate header.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="job-name">Job name</Label>
                <Input id="job-name" value={jobName} onChange={(e) => setJobName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="job-address">Property address</Label>
                <Input
                  id="job-address"
                  placeholder="123 Main St, City, ST"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Measurements
              </CardTitle>
              <CardDescription>
                Enter footprint + pitch to estimate true roof area. Add waste for cuts and starters.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="footprint">Building footprint (sqft)</Label>
                  <Input id="footprint" inputMode="decimal" value={buildingFootprintSqft} onChange={(e) => setBuildingFootprintSqft(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pitch">Pitch (x / 12)</Label>
                  <Select value={pitch} onValueChange={setPitch}>
                    <SelectTrigger id="pitch">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["0","3","4","5","6","7","8","9","10","12"].map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}/12
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="waste">Waste (%)</Label>
                  <Input id="waste" inputMode="decimal" value={wastePct} onChange={(e) => setWastePct(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="eave">Eaves (lf)</Label>
                  <Input id="eave" inputMode="decimal" value={eaveLf} onChange={(e) => setEaveLf(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rake">Rakes (lf)</Label>
                  <Input id="rake" inputMode="decimal" value={rakeLf} onChange={(e) => setRakeLf(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ridge">Ridge (lf)</Label>
                  <Input id="ridge" inputMode="decimal" value={ridgeLf} onChange={(e) => setRidgeLf(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="boots">Pipe boots (ea)</Label>
                  <Input id="boots" inputMode="numeric" value={pipeBootsCount} onChange={(e) => setPipeBootsCount(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vents">Vents (ea)</Label>
                  <Input id="vents" inputMode="numeric" value={ventsCount} onChange={(e) => setVentsCount(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="layers">Tear-off layers</Label>
                  <Select value={tearOffLayers} onValueChange={setTearOffLayers}>
                    <SelectTrigger id="layers">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["0","1","2","3"].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="flex flex-wrap gap-3 items-center">
                  <Badge variant="secondary">Slope factor: {derived.slope.toFixed(3)}×</Badge>
                  <Badge variant="secondary">Roof area: {Math.round(derived.roofArea).toLocaleString()} sqft</Badge>
                  <Badge variant="secondary">With waste: {Math.round(derived.roofAreaWithWaste).toLocaleString()} sqft</Badge>
                  <Badge variant="default">Squares: {derived.squares.toFixed(1)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Scope & pricing
              </CardTitle>
              <CardDescription>
                Choose materials and adjust labor/fees. Difficulty scales labor and tear-off.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="steep">Steep</SelectItem>
                      <SelectItem value="complex">Complex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Shingle type</Label>
                  <Select value={shingleType} onValueChange={(v) => setShingleType(v as ShingleType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="architectural">Architectural</SelectItem>
                      <SelectItem value="three-tab">3-tab</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="labor">Labor (per square)</Label>
                  <Input id="labor" inputMode="decimal" value={laborPerSquare} onChange={(e) => setLaborPerSquare(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="tearoff">Tear-off (per square / layer)</Label>
                  <Input id="tearoff" inputMode="decimal" value={tearOffPerSquarePerLayer} onChange={(e) => setTearOffPerSquarePerLayer(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dumpster">Dumpster / dump fee</Label>
                  <Input id="dumpster" inputMode="decimal" value={dumpsterFee} onChange={(e) => setDumpsterFee(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="permit">Permit / inspection</Label>
                  <Input id="permit" inputMode="decimal" value={permitFee} onChange={(e) => setPermitFee(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="grid gap-1">
                  <Label htmlFor="icewater-toggle">Include ice & water shield</Label>
                  <div className="text-sm text-muted-foreground">
                    Estimated as eave length × 3ft × courses.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={iceWaterCourses}
                    onValueChange={setIceWaterCourses}
                    disabled={!includeIceWater}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 course (3ft)</SelectItem>
                      <SelectItem value="2">2 courses (6ft)</SelectItem>
                      <SelectItem value="3">3 courses (9ft)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Switch id="icewater-toggle" checked={includeIceWater} onCheckedChange={setIncludeIceWater} />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-4">
                <div className="grid gap-2">
                  <Label htmlFor="overhead" className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Overhead (%)
                  </Label>
                  <Input id="overhead" inputMode="decimal" value={overheadPct} onChange={(e) => setOverheadPct(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profit" className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Profit (%)
                  </Label>
                  <Input id="profit" inputMode="decimal" value={profitPct} onChange={(e) => setProfitPct(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tax">Tax (%)</Label>
                  <Input id="tax" inputMode="decimal" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Tax mode</Label>
                  <Select value={taxMode} onValueChange={(v) => setTaxMode(v as TaxMode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="materials_only">Materials only</SelectItem>
                      <SelectItem value="subtotal">Subtotal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2 md:max-w-sm">
                <Label htmlFor="discount">Discount (flat)</Label>
                <Input id="discount" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Summary
                </CardTitle>
                <CardDescription>
                  {jobName}
                  {address ? ` • ${address}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Materials</span>
                  <span className="font-medium">{money(totals.materials)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Labor</span>
                  <span className="font-medium">{money(totals.labor)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fees</span>
                  <span className="font-medium">{money(totals.fees)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{money(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overhead</span>
                  <span className="font-medium">{money(totals.overhead)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profit</span>
                  <span className="font-medium">{money(totals.profit)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{money(totals.tax)}</span>
                </div>
                {totals.discount > 0 ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium">-{money(totals.discount)}</span>
                  </div>
                ) : null}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-2xl font-bold">{money(totals.total)}</span>
                </div>

                <div className="grid gap-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>$/sq</span>
                    <span className="font-medium">{money(totals.costPerSq)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>$/sqft</span>
                    <span className="font-medium">{money(totals.costPerSqft)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Line items
                </CardTitle>
                <CardDescription>What the customer is paying for.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-[120px] text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((li) => (
                      <TableRow key={li.key}>
                        <TableCell>
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium">{li.name}</div>
                            <Badge variant="secondary" className="capitalize">
                              {li.category}
                            </Badge>
                          </div>
                          {li.qty !== undefined && li.rate !== undefined ? (
                            <div className="text-xs text-muted-foreground">
                              {li.qty.toFixed(2)} {li.unit ?? ""} × {money(li.rate)}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right font-medium">{money(li.total)}</TableCell>
                      </TableRow>
                    ))}
                    {!lineItems.length ? (
                      <TableRow>
                        <TableCell colSpan={2} className="h-20 text-center text-muted-foreground">
                          Add measurements to generate line items.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

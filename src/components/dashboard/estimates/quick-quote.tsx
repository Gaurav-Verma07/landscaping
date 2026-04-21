"use client"

import { useState } from "react"
import { Calculator, DollarSign, Ruler, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function QuickQuote() {
  // --- State ---
  const [roofSize, setRoofSize] = useState<number | "">("")
  const [roofSizeUnit, setRoofSizeUnit] = useState<"sqft" | "squares">("sqft")
  const [waste, setWaste] = useState([15])
  const [difficulty, setDifficulty] = useState("standard")
  const [margin, setMargin] = useState([40])

  // --- Derived State & Logic ---
  const roofSizeNum = typeof roofSize === "number" ? roofSize : 0
  const wastePercent = waste[0]
  const marginPercent = margin[0]

  // Roof squares (1 square = 100 sqft)
  const baseSquares = roofSizeUnit === "squares" ? roofSizeNum : roofSizeNum / 100
  const actualSquares = baseSquares * (1 + wastePercent / 100)
  const baseSqFt = baseSquares * 100
  const actualSqFt = actualSquares * 100

  // Base material cost per sq ft (varies by difficulty)
  const baseMaterialCosts = {
    easy: 2.5,
    standard: 3.5,
    difficult: 5.0,
    complex: 7.5
  }

  const baseMaterialCost = baseMaterialCosts[difficulty as keyof typeof baseMaterialCosts] || 3.5

  // Calculate material cost from actual squares (includes waste)
  const materialCost = actualSqFt * baseMaterialCost

  // Labor cost (typically 40-60% of material cost)
  const laborCost = materialCost * 0.5

  // Subtotal
  const subtotal = materialCost + laborCost

  // Apply margin
  const total = subtotal * (1 + marginPercent / 100)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Auto-calculate sq ft from dimensions
  const handleDimensionChange = (length: string, width: string) => {
    const len = parseFloat(length) || 0
    const wid = parseFloat(width) || 0
    if (len > 0 && wid > 0) {
      setRoofSizeUnit("sqft")
      setRoofSize(len * wid)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Quick Quote Calculator
          </CardTitle>
          <CardDescription>
            Generate instant estimates based on square footage and project complexity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Roof Size Input */}
          <div className="space-y-2">
            <Label htmlFor="roof-size" className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Roof Size
            </Label>
            <div className="flex gap-2">
              <Input
                id="roof-size"
                type="number"
                placeholder={roofSizeUnit === "sqft" ? "Enter square feet" : "Enter squares"}
                value={roofSize}
                onChange={(e) => {
                  const val = e.target.value
                  setRoofSize(val === "" ? "" : parseFloat(val) || "")
                }}
                min="0"
                step="0.01"
              />
              <Select value={roofSizeUnit} onValueChange={(value) => setRoofSizeUnit(value as "sqft" | "squares")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">Sq Ft</SelectItem>
                  <SelectItem value="squares">Squares</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {roofSizeNum > 0 ? (
              <p className="text-xs text-muted-foreground">
                Base: {baseSquares.toFixed(1)} sq • Actual (w/ waste): {actualSquares.toFixed(1)} sq
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label htmlFor="length" className="text-xs text-muted-foreground">
                  Length (ft)
                </Label>
                <Input
                  id="length"
                  type="number"
                  placeholder="0"
                  onChange={(e) => {
                    const widthEl = document.getElementById("width") as HTMLInputElement
                    handleDimensionChange(e.target.value, widthEl?.value || "")
                  }}
                />
              </div>
              <div>
                <Label htmlFor="width" className="text-xs text-muted-foreground">
                  Width (ft)
                </Label>
                <Input
                  id="width"
                  type="number"
                  placeholder="0"
                  onChange={(e) => {
                    const lengthEl = document.getElementById("length") as HTMLInputElement
                    handleDimensionChange(lengthEl?.value || "", e.target.value)
                  }}
                />
              </div>
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              Project Difficulty
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the complexity level based on roof pitch, accessibility, and material requirements</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <RadioGroup value={difficulty} onValueChange={setDifficulty}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="easy" id="easy" className="peer sr-only" />
                  <Label
                    htmlFor="easy"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="font-medium">Easy</span>
                    <span className="text-xs text-muted-foreground">Low pitch, accessible</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="standard" id="standard" className="peer sr-only" />
                  <Label
                    htmlFor="standard"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="font-medium">Standard</span>
                    <span className="text-xs text-muted-foreground">Moderate complexity</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="difficult" id="difficult" className="peer sr-only" />
                  <Label
                    htmlFor="difficult"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="font-medium">Difficult</span>
                    <span className="text-xs text-muted-foreground">Steep pitch, limited access</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="complex" id="complex" className="peer sr-only" />
                  <Label
                    htmlFor="complex"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="font-medium">Complex</span>
                    <span className="text-xs text-muted-foreground">Very steep, premium materials</span>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Waste Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="waste">Material Waste</Label>
              <Badge variant="outline">{waste[0]}%</Badge>
            </div>
            <Slider
              id="waste"
              min={5}
              max={30}
              step={1}
              value={waste}
              onValueChange={setWaste}
            />
            <p className="text-xs text-muted-foreground">
              Account for cutting waste and material loss
            </p>
          </div>

          {/* Profit Margin */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="margin">Profit Margin</Label>
              <Badge variant="outline">{margin[0]}%</Badge>
            </div>
            <Slider
              id="margin"
              min={20}
              max={60}
              step={1}
              value={margin}
              onValueChange={setMargin}
            />
            <p className="text-xs text-muted-foreground">
              Your desired profit margin on the project
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      {baseSquares > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Estimate Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Actual Squares (w/ waste)</span>
                <span>{actualSquares.toFixed(1)} sq</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Material Cost</span>
                <span>{formatCurrency(materialCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Labor Cost</span>
                <span>{formatCurrency(laborCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profit Margin ({marginPercent}%)</span>
                <span>{formatCurrency(total - subtotal)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                <span>Total Estimate</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Cost per sq ft (base): {formatCurrency(total / baseSqFt)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


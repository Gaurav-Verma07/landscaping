"use client"

import * as React from "react"
import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LaborRate } from "@/types/invoice.types"
import { mockCrewAssignments } from "@/lib/mock/invoice-mock-data"
import { cn } from "@/lib/utils"
import { money } from "@/components/dashboard/invoices/shared/format"

interface LaborRatesTableProps {
  laborRates: LaborRate[]
  onRateSelect?: (rate: LaborRate) => void
  onRateEdit?: (rate: LaborRate) => void
  onRateDelete?: (rateId: string) => void
  className?: string
}

export function LaborRatesTable({ 
  laborRates,
  onRateSelect, 
  onRateEdit, 
  onRateDelete,
  className 
}: LaborRatesTableProps) {
  return (
    <div className={cn("rounded-lg border overflow-hidden", className)}>
      <div className="overflow-auto">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead className="px-2 py-3">Role</TableHead>
              <TableHead className="px-2 py-3">Type</TableHead>
              <TableHead className="px-2 py-3 text-right">Rate</TableHead>
              <TableHead className="px-2 py-3 text-right">Overtime</TableHead>
              <TableHead className="px-2 py-3">Default crew</TableHead>
              <TableHead className="w-24 px-2 py-3"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {laborRates.length ? (
              laborRates.map((rate) => (
                <TableRow key={rate.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onRateSelect?.(rate)}>
                  <TableCell className="px-2 py-3 font-medium">{rate.roleName}</TableCell>
                  <TableCell className="px-2 py-3">
                    <Badge variant="outline" className="capitalize">
                      {rate.rateType}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2 py-3 text-right">{money(rate.rate)}</TableCell>
                  <TableCell className="px-2 py-3 text-right">{rate.overtimeRate ? money(rate.overtimeRate) : "—"}</TableCell>
                  <TableCell className="px-2 py-3">
                    <div className="flex flex-wrap gap-1">
                      {rate.defaultCrew?.slice(0, 2).map((id) => {
                        const crew = mockCrewAssignments.find((c) => c.id === id)
                        return crew ? (
                          <Badge key={id} variant="secondary">
                            {crew.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onRateEdit?.(rate)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onRateDelete?.(rate.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No labor rates.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}





"use client"

import * as React from "react"
import { Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Material } from "@/types/invoice.types"
import { cn } from "@/lib/utils"
import { money } from "@/components/dashboard/invoices/shared/format"

interface MaterialsTableProps {
  materials: Material[]
  onMaterialSelect?: (material: Material) => void
  onMaterialEdit?: (material: Material) => void
  onMaterialDelete?: (materialId: string) => void
  className?: string
}

export function MaterialsTable({ 
  materials,
  onMaterialSelect, 
  onMaterialEdit, 
  onMaterialDelete,
  className 
}: MaterialsTableProps) {
  return (
    <div className={cn("rounded-lg border overflow-hidden", className)}>
      <div className="overflow-auto">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead className="px-2 py-3">Name</TableHead>
              <TableHead className="px-2 py-3">Vendor</TableHead>
              <TableHead className="px-2 py-3">Unit</TableHead>
              <TableHead className="px-2 py-3 text-right">Price</TableHead>
              <TableHead className="px-2 py-3 text-right">Stock</TableHead>
              <TableHead className="w-24 px-2 py-3"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length ? (
              materials.map((m) => (
                <TableRow key={m.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onMaterialSelect?.(m)}>
                  <TableCell className="px-2 py-3">
                    <div className="font-medium">{m.name}</div>
                    {m.description ? <div className="text-xs text-muted-foreground">{m.description}</div> : null}
                  </TableCell>
                  <TableCell className="px-2 py-3">{m.vendorName}</TableCell>
                  <TableCell className="px-2 py-3">
                    <Badge variant="outline">{m.unit}</Badge>
                  </TableCell>
                  <TableCell className="px-2 py-3 text-right font-medium">{money(m.unitPrice)}</TableCell>
                  <TableCell className="px-2 py-3 text-right">{m.stock}</TableCell>
                  <TableCell className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onMaterialEdit?.(m)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onMaterialDelete?.(m.id)}>
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
                  No materials.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { IconDotsVertical, IconFileText } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useBillingStore } from "@/lib/stores"
import { useCustomerStore } from "@/lib/stores"
import { CONTRACT_STATUSES, CONTRACT_STATUS_LABELS } from "@/types/quote-types"
import { SignContractDialog } from "./sign-contract-dialog"
import type { Contract } from "@/types/quote-types"

export function ContractsWorkspace() {
  const searchParams = useSearchParams()
  const quoteIdParam = searchParams.get("quoteId")
  const { contracts, getContract, getQuote, deleteContract } = useBillingStore()
  const { getCustomer } = useCustomerStore()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [signContract, setSignContract] = useState<Contract | null>(null)

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      const customer = getCustomer(c.customerId)
      const numberMatch = !search || c.contractNumber.toLowerCase().includes(search.toLowerCase())
      const customerMatch = !search || customer?.name?.toLowerCase().includes(search.toLowerCase())
      const titleMatch = !search || c.title.toLowerCase().includes(search.toLowerCase())
      const statusMatch = statusFilter === "all" || c.status === statusFilter
      const quoteMatch = !quoteIdParam || c.quoteId === quoteIdParam
      return (numberMatch || customerMatch || titleMatch) && statusMatch && quoteMatch
    })
  }, [contracts, search, statusFilter, quoteIdParam, getCustomer])

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground text-sm">
            Contracts created from accepted quotes. Sign to confirm.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by number, title or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {CONTRACT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{CONTRACT_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((contract) => {
          const customer = getCustomer(contract.customerId)
          const quote = getQuote(contract.quoteId)
          return (
            <Card key={contract.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">
                      <Link href={`/dashboard/contracts/${contract.id}`} className="hover:underline">
                        {contract.contractNumber}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{contract.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{customer?.name ?? customer?.companyName ?? "—"}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <IconDotsVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/contracts/${contract.id}`}>View</Link>
                      </DropdownMenuItem>
                      {contract.status === "pending_signature" && (
                        <DropdownMenuItem onClick={() => setSignContract(contract)}>
                          Sign contract
                        </DropdownMenuItem>
                      )}
                      {contract.projectId && (
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/projects/${contract.projectId}`}>View project</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteContract(contract.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant={contract.status === "signed" ? "default" : "secondary"}>
                    {CONTRACT_STATUS_LABELS[contract.status]}
                  </Badge>
                  {quote && <Badge variant="outline">From {quote.quoteNumber}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {contract.signedAt ? `Signed ${new Date(contract.signedAt).toLocaleDateString()}` : "Awaiting signature"}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {contracts.length === 0 ? "No contracts yet. Accept a quote to create one." : "No contracts match your filters."}
            </p>
          </CardContent>
        </Card>
      )}

      <SignContractDialog
        open={!!signContract}
        onOpenChange={(open) => !open && setSignContract(null)}
        contract={signContract}
        onSigned={() => setSignContract(null)}
      />
    </div>
  )
}

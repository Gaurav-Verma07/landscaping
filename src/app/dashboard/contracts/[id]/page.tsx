"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Pencil, FileSignature } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBillingStore } from "@/lib/stores"
import { useCustomerStore } from "@/lib/stores"
import { CONTRACT_STATUS_LABELS } from "@/types/quote-types"
import { SignContractDialog } from "@/components/dashboard/billing/sign-contract-dialog"
import type { Contract } from "@/types/quote-types"

export default function ContractDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { getContract, getQuote } = useBillingStore()
  const { getCustomer } = useCustomerStore()
  const contract = getContract(id)
  const [signOpen, setSignOpen] = useState(false)

  if (!contract) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <p className="text-muted-foreground">Contract not found.</p>
        <Button variant="link" asChild>
          <Link href="/dashboard/contracts">Back to contracts</Link>
        </Button>
      </div>
    )
  }

  const customer = getCustomer(contract.customerId)
  const quote = getQuote(contract.quoteId)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/contracts">
            <ArrowLeft className="size-4" />
            Back to contracts
          </Link>
        </Button>
        {contract.status === "pending_signature" && (
          <Button size="sm" onClick={() => setSignOpen(true)}>
            <FileSignature className="size-4 mr-2" />
            Sign contract
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{contract.contractNumber}</h1>
        <Badge variant={contract.status === "signed" ? "default" : "secondary"}>
          {CONTRACT_STATUS_LABELS[contract.status]}
        </Badge>
        {customer && (
          <span className="text-muted-foreground text-sm">
            · {customer.name || customer.companyName}
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{contract.title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {quote && <span>From quote {quote.quoteNumber}</span>}
            {contract.signedAt && (
              <span> · Signed {new Date(contract.signedAt).toLocaleString()} by {contract.signedBy ?? "—"}</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-sans text-sm rounded-md bg-muted/50 p-4">{contract.content}</pre>
        </CardContent>
      </Card>

      {contract.projectId && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/projects/${contract.projectId}`}>View project</Link>
        </Button>
      )}

      <SignContractDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        contract={contract}
        onSigned={() => setSignOpen(false)}
      />
    </div>
  )
}

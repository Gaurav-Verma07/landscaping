"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import type { Contract } from "@/types/quote-types"
import { useBillingStore } from "@/lib/stores"

interface SignContractDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract: Contract | null
  onSigned?: () => void
}

export function SignContractDialog({
  open,
  onOpenChange,
  contract,
  onSigned,
}: SignContractDialogProps) {
  const { signContract } = useBillingStore()
  const [signedBy, setSignedBy] = useState("")

  const handleSign = () => {
    if (!contract) return
    if (!signedBy.trim()) {
      toast.error("Enter signer name.")
      return
    }
    signContract(contract.id, signedBy.trim())
    toast.success("Contract signed.")
    setSignedBy("")
    onOpenChange(false)
    onSigned?.()
  }

  if (!contract) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign contract</DialogTitle>
          <DialogDescription>
            E-signature: confirm by entering the signer name. Contract will be marked as signed with current date/time.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">Contract: {contract.contractNumber} — {contract.title}</p>
          <Field>
            <FieldLabel>Signer name</FieldLabel>
            <Input
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
              placeholder="Full name"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSign}>Sign contract</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

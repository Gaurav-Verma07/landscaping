'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserPlus, ArrowRight } from 'lucide-react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useOutreachStore } from '@/lib/outreach-store'
import { useCustomerStore } from '@/lib/customer-store'
import { createClient } from '@/lib/supabase/client'
import type { OutreachProspect } from '@/lib/outreach-types'
import { createCustomer as createCustomerAction } from '@/lib/actions/customers'

interface ConvertProspectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospect: OutreachProspect | null
  onConverted?: (customerId: string) => void
}

export function ConvertProspectDialog({
  open, onOpenChange, prospect, onConverted,
}: ConvertProspectDialogProps) {
  const router = useRouter()
  const { moveProspectStage, refresh: refreshOutreach } = useOutreachStore()
  const {  refresh: refreshCustomers } = useCustomerStore()
  const [converting, setConverting] = useState(false)

  const handleConvert = async () => {
    if (!prospect) return
    setConverting(true)
  
    try {
      // Call action directly to get the ID back immediately
      const result = await createCustomerAction({
        name: prospect.name || prospect.company,
        companyName: prospect.company,
        phones: prospect.phone ? [prospect.phone] : [],
        emails: prospect.email ? [prospect.email] : [],
        addresses: prospect.location ? [prospect.location] : [],
        tags: [prospect.targetType, prospect.leadSource].filter(Boolean),
        leadSource: mapLeadSource(prospect.leadSource),
        partnerReferralName: '',
        status: 'Lead',
        reviewStatus: '',
        seasonalServiceEligibility: false,
      })
  
      if ('error' in result || !result.data) {
        toast.error(result.error ?? 'Failed to create customer.')
        return
      }
  
      const customerId = result.data.id
  
      // Link prospect communications to new customer
      const supabase = createClient()
      await supabase
        .from('communications')
        .update({ customer_id: customerId, contact_type: 'customer' })
        .eq('prospect_id', prospect.id)
  
      // Move prospect to Partner
      await moveProspectStage(prospect.id, 'Partner')
      await refreshOutreach()
      await refreshCustomers()
  
      toast.success(`${prospect.company || prospect.name} converted to customer.`)
      onConverted?.(customerId)
      onOpenChange(false)
      router.push(`/dashboard/customers/${customerId}`)
    } catch (err) {
      console.error('Convert error:', err)
      toast.error('Failed to convert prospect.')
    } finally {
      setConverting(false)
    }
  }

  if (!prospect) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Convert to Customer
          </DialogTitle>
          <DialogDescription>
            This will create a new customer record from this prospect.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* What will be created */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">New customer will be created with:</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{prospect.name || prospect.company || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium">{prospect.company || '—'}</span>
              </div>
              {prospect.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{prospect.email}</span>
                </div>
              )}
              {prospect.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{prospect.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-xs">Lead</Badge>
              </div>
            </div>
          </div>

          {/* What else happens */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Also:</p>
            <div className="flex items-center gap-2">
              <ArrowRight className="size-3.5 shrink-0" />
              <span>All communications with this prospect linked to the new customer</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="size-3.5 shrink-0" />
              <span>Prospect stage moved to <strong>Partner</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="size-3.5 shrink-0" />
              <span>You'll be redirected to the new customer profile</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={converting}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={converting}>
            {converting ? 'Converting...' : 'Convert to Customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Map outreach lead source to customer lead source
function mapLeadSource(source: string): string {
  const map: Record<string, string> = {
    companies_house: 'cold_outreach',
    openstreetmap: 'cold_outreach',
    geoapify: 'cold_outreach',
    Manual: 'other',
    manual: 'other',
  }
  return map[source] ?? 'other'
}
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Field, FieldLabel } from '@/components/ui/field'
import { useOutreachStore } from '@/lib/outreach-store'
import {
  OUTREACH_STAGE_LABELS, OUTREACH_TARGET_TYPE_LABELS,
  type OutreachProspect, type OutreachStage, type OutreachTargetType,
} from '@/lib/outreach-types'

const STAGES: OutreachStage[] = ['New', 'Contacted', 'Responded', 'Qualified', 'Partner', 'Archived']
const FORM_ID = 'outreach-prospect-form'

interface ProspectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospect: OutreachProspect | null
}

export function ProspectFormDialog({ open, onOpenChange, prospect }: ProspectFormDialogProps) {
  const { createProspect, updateProspect } = useOutreachStore()
  const isEdit = !!prospect

  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [targetType, setTargetType] = useState<OutreachTargetType>('Realtor')
  const [location, setLocation] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [stage, setStage] = useState<OutreachStage>('New')
  const [leadSource, setLeadSource] = useState('')

  const reset = () => {
    setName(''); setCompany(''); setTargetType('Realtor'); setLocation('')
    setIndustry(''); setCompanySize(''); setEmail(''); setPhone('')
    setNotes(''); setStage('New'); setLeadSource('')
  }

  useEffect(() => {
    if (open && prospect) {
      setName(prospect.name)
      setCompany(prospect.company)
      setTargetType(prospect.targetType)
      setLocation(prospect.location)
      setIndustry(prospect.industry)
      setCompanySize(prospect.companySize)
      setEmail(prospect.email ?? '')
      setPhone(prospect.phone ?? '')
      setNotes(prospect.notes)
      setStage(prospect.stage)
      setLeadSource(prospect.leadSource)
    } else if (open && !prospect) {
      reset()
    }
  }, [open, prospect?.id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() && !company.trim()) return
    const data = {
      name: name.trim(), company: company.trim(), targetType,
      location: location.trim(), industry: industry.trim(),
      companySize: companySize.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim(), stage,
      leadSource: leadSource.trim(),
    }
    if (isEdit && prospect) {
      updateProspect(prospect.id, data)
    } else {
      createProspect({ ...data, leadSource: data.leadSource || 'Manual' })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next) }}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit prospect' : 'New prospect'}</DialogTitle>
        </DialogHeader>
        <form id={FORM_ID} onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Contact / name</FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Doe" />
            </Field>
            <Field>
              <FieldLabel>Company</FieldLabel>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Realty" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel>Target type</FieldLabel>
              <Select value={targetType} onValueChange={(v) => setTargetType(v as OutreachTargetType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(OUTREACH_TARGET_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Location</FieldLabel>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City / region" />
            </Field>
            <Field>
              <FieldLabel>Industry</FieldLabel>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Residential" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel>Company size</FieldLabel>
              <Input value={companySize} onChange={(e) => setCompanySize(e.target.value)} placeholder="e.g. 1–10" />
            </Field>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </Field>
            <Field>
              <FieldLabel>Phone</FieldLabel>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Stage</FieldLabel>
              <Select value={stage} onValueChange={(v) => setStage(v as OutreachStage)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{OUTREACH_STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Lead source</FieldLabel>
              <Input value={leadSource} onChange={(e) => setLeadSource(e.target.value)} placeholder="e.g. LinkedIn search" />
            </Field>
          </div>
          <Field>
            <FieldLabel>Notes</FieldLabel>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Context, last touch, next step…" />
          </Field>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false) }}>Cancel</Button>
          <Button type="submit" form={FORM_ID}>{isEdit ? 'Save' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
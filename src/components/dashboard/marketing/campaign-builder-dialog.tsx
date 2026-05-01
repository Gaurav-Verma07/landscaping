'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Sparkles, Calendar, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { useMarketingStore } from '@/lib/marketing-store'
import {
  AUDIENCE_TYPE_LABELS, type Campaign, type AudienceType, type AudienceFilters,
} from '@/lib/marketing-types'
import { SEASONAL_TEMPLATES, type SeasonalTemplate } from '@/lib/marketing-templates'

interface CampaignBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign | null
}

const AUDIENCE_TYPES = Object.entries(AUDIENCE_TYPE_LABELS) as [AudienceType, string][]

export function CampaignBuilderDialog({ open, onOpenChange, campaign }: CampaignBuilderDialogProps) {
  const { createCampaign, updateCampaign } = useMarketingStore()
  const isEdit = !!campaign

  const [name, setName] = useState('')
  const [audienceType, setAudienceType] = useState<AudienceType>('all_customers')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [generatingAi, setGeneratingAi] = useState(false)
  const [saving, setSaving] = useState(false)

  // Scheduling — false = send immediately, true = schedule for later
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')

  // Seasonal templates panel
  const [templatesOpen, setTemplatesOpen] = useState(false)

  useEffect(() => {
    if (open) {
      if (campaign) {
        setName(campaign.name)
        setAudienceType(campaign.audienceType)
        setSubject(campaign.subject)
        setBody(campaign.body)
        if (campaign.scheduledAt) {
          setScheduleEnabled(true)
          const d = new Date(campaign.scheduledAt)
          setScheduledDate(format(d, 'yyyy-MM-dd'))
          setScheduledTime(format(d, 'HH:mm'))
        } else {
          setScheduleEnabled(false)
          setScheduledDate('')
          setScheduledTime('09:00')
        }
      } else {
        setName('')
        setAudienceType('all_customers')
        setSubject('')
        setBody('')
        setScheduleEnabled(false)
        setScheduledDate('')
        setScheduledTime('09:00')
      }
      setAiPrompt('')
      setTemplatesOpen(false)
    }
  }, [open, campaign])

  const applyTemplate = (t: SeasonalTemplate) => {
    setName(t.name)
    setSubject(t.subject)
    setBody(t.body)
    setAudienceType(t.audienceType)
    setTemplatesOpen(false)
    toast.success(`Template "${t.name}" applied.`)
  }

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) { toast.error('Describe the campaign first.'); return }
    setGeneratingAi(true)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a marketing copywriter for a landscaping business. Generate an email campaign based on this description: "${aiPrompt}"

Target audience: ${AUDIENCE_TYPE_LABELS[audienceType]}

Respond ONLY with a JSON object in this exact format, no markdown, no preamble:
{"subject": "email subject line here", "body": "email body here with line breaks using \\n"}

Keep the body professional, friendly, and under 150 words. Use {{contact_name}} as the personalisation placeholder.`,
          }],
        }),
      })
      const data = await response.json()
      const text = data.content?.[0]?.text ?? ''
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      if (parsed.subject) setSubject(parsed.subject)
      if (parsed.body) setBody(parsed.body)
      toast.success('AI copy generated.')
    } catch {
      toast.error('Failed to generate copy. Try again.')
    } finally {
      setGeneratingAi(false)
    }
  }

  const getScheduledAt = (): string | null => {
    if (!scheduleEnabled || !scheduledDate) return null
    return new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
  }

  const handleSave = async (asDraft = true) => {
    if (!name.trim()) { toast.error('Please enter a campaign name.'); return }
    if (!subject.trim()) { toast.error('Please enter a subject line.'); return }
    if (!body.trim()) { toast.error('Please enter a message body.'); return }
    if (!asDraft && scheduleEnabled && !scheduledDate) {
      toast.error('Please pick a date to schedule the campaign.')
      return
    }

    const scheduledAt = asDraft ? null : getScheduledAt()
    setSaving(true)
    try {
      const filters: AudienceFilters = {}
      if (isEdit && campaign) {
        await updateCampaign(campaign.id, { name, subject, body, audienceType, audienceFilters: filters, scheduledAt })
        toast.success('Campaign updated.')
      } else {
        await createCampaign({ name, subject, body, audienceType, audienceFilters: filters, scheduledAt })
        toast.success(scheduledAt
          ? `Campaign scheduled for ${format(new Date(scheduledAt), 'MMM d, yyyy HH:mm')}.`
          : 'Campaign saved as draft.')
      }
      onOpenChange(false)
    } catch {
      toast.error('Failed to save campaign.')
    } finally {
      setSaving(false)
    }
  }

  const minDate = format(new Date(), 'yyyy-MM-dd')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit campaign' : 'New campaign'}</DialogTitle>
          <DialogDescription>
            Build your email campaign. Use a seasonal template, AI copy generation, or write from scratch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* Seasonal templates */}
          <Collapsible open={templatesOpen} onOpenChange={setTemplatesOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  Seasonal templates
                </span>
                <ChevronDown className={`size-4 transition-transform ${templatesOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="grid gap-2 sm:grid-cols-2">
                {SEASONAL_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{t.emoji}</span>
                      <span className="font-medium text-sm">{t.name}</span>
                      <Badge variant="outline" className="text-xs ml-auto">{t.season}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Campaign name */}
          <Field>
            <FieldLabel>Campaign name</FieldLabel>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spring cleanup promotion" />
          </Field>

          {/* Audience */}
          <Field>
            <FieldLabel>Audience</FieldLabel>
            <Select value={audienceType} onValueChange={v => setAudienceType(v as AudienceType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUDIENCE_TYPES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Emails without an address are skipped automatically.
            </FieldDescription>
          </Field>

          {/* AI generator */}
          <div className="rounded-lg border border-dashed p-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              AI copy generator
            </p>
            <div className="flex gap-2">
              <Input
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. Offer 10% off spring lawn cleanup to returning customers"
                className="flex-1"
                onKeyDown={e => e.key === 'Enter' && handleGenerateAi()}
              />
              <Button
                type="button" variant="outline" size="sm"
                onClick={handleGenerateAi}
                disabled={generatingAi || !aiPrompt.trim()}
              >
                {generatingAi ? <Loader2 className="size-4 animate-spin" /> : 'Generate'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Describe your campaign — Claude writes the subject and body.
            </p>
          </div>

          {/* Subject */}
          <Field>
            <FieldLabel>Subject line</FieldLabel>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Your lawn is ready for spring 🌱" />
          </Field>

          {/* Body */}
          <Field>
            <FieldLabel>Message body</FieldLabel>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Use {{contact_name}} to personalise each email..."
              rows={8}
              className="resize-none font-mono text-sm"
            />
            <FieldDescription>
              Use {`{{contact_name}}`} — replaced with each recipient's name when sent.
            </FieldDescription>
          </Field>

        </div>

          {/* Schedule */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="size-4" />
                Schedule for later
              </Label>
              <Switch
                checked={scheduleEnabled}
                onCheckedChange={setScheduleEnabled}
              />
            </div>
            {scheduleEnabled ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Date</FieldLabel>
                  <Input
                    type="date"
                    value={scheduledDate}
                    min={minDate}
                    onChange={e => setScheduledDate(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Time</FieldLabel>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                  />
                </Field>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Off — campaign will send immediately when you click Send.
              </p>
            )}
          </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
            Save as draft
          </Button>
          <Button onClick={() => handleSave(false)} disabled={saving}>
            {saving
              ? <><Loader2 className="size-4 mr-2 animate-spin" />Saving...</>
              : scheduleEnabled
                ? 'Schedule campaign'
                : isEdit ? 'Save changes' : 'Send campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
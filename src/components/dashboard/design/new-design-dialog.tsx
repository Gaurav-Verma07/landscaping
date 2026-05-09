'use client'

// components/dashboard/design/new-design-dialog.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateDesign } from '@/lib/hooks/use-design'
import { useCustomers } from '@/lib/hooks/use-customers'
import { useProjects } from '@/lib/hooks/use-projects'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCustomerId?: string
  defaultProjectId?: string
}

export function NewDesignDialog({ open, onOpenChange, defaultCustomerId, defaultProjectId }: Props) {
  const router = useRouter()
  const createDesign = useCreateDesign()
  const { data: customers = [] } = useCustomers()
  const { data: projects = [] } = useProjects()

  const [name, setName] = useState('')
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? '')
  const [projectId, setProjectId] = useState(defaultProjectId ?? '')
  const [notes, setNotes] = useState('')

  const customerProjects = projects.filter((p) => p.customerId === customerId)

  async function handleCreate() {
    if (!name.trim()) { toast.error('Design name is required'); return }
    if (!customerId) { toast.error('Please select a customer'); return }

    const result = await createDesign.mutateAsync({
      name: name.trim(),
      customerId,
      projectId: projectId || null,
      notes,
    })

    if ('error' in result) {
      toast.error(result.error)
      return
    }

    toast.success('Design created')
    onOpenChange(false)
    setName('')
    setCustomerId(defaultCustomerId ?? '')
    setProjectId(defaultProjectId ?? '')
    setNotes('')
    router.push(`/dashboard/design/${result.data.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Landscape Design</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field>
            <FieldLabel required>Design Name</FieldLabel>
            <Input
              placeholder="e.g. Front Yard Refresh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel required>Customer</FieldLabel>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer…" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.companyName ? ` — ${c.companyName}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {customerProjects.length > 0 && (
            <Field>
              <FieldLabel>Link to Project (optional)</FieldLabel>
              <Select value={projectId || '__none__'} onValueChange={(v) => setProjectId(v === '__none__' ? '' : v)}>
                    <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No project</SelectItem>
                  {customerProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field>
            <FieldLabel>Notes</FieldLabel>
            <Textarea
              placeholder="Design goals, constraints, customer preferences…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createDesign.isPending}>
            {createDesign.isPending ? 'Creating…' : 'Create & Open Editor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
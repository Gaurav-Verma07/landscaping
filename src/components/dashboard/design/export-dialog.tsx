'use client'

// components/dashboard/design/export-dialog.tsx

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2, Image as ImageIcon, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  designName: string
  onExportPng: () => Promise<string | null>
  onExportPdf: (includeLegend: boolean, includeMaterials: boolean) => Promise<void>
}

type ExportFormat = 'png' | 'pdf'

export function ExportDialog({
  open,
  onOpenChange,
  designName,
  onExportPng,
  onExportPdf,
}: Props) {
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [includeLegend, setIncludeLegend] = useState(true)
  const [includeMaterials, setIncludeMaterials] = useState(true)
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      if (format === 'png') {
        const dataUrl = await onExportPng()
        if (!dataUrl) { toast.error('Export failed'); return }
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `${designName.replace(/\s+/g, '-').toLowerCase()}.png`
        a.click()
        toast.success('PNG exported')
      } else {
        await onExportPdf(includeLegend, includeMaterials)
        toast.success('PDF exported')
      }
      onOpenChange(false)
    } catch (e) {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Design
          </DialogTitle>
          <DialogDescription>
            Export &ldquo;{designName}&rdquo; as an image or PDF proposal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <p className="text-sm font-medium mb-2">Format</p>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
              className="space-y-2"
            >
              <div className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="pdf" id="fmt-pdf" />
                <Label htmlFor="fmt-pdf" className="cursor-pointer flex items-center gap-2 flex-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">PDF Proposal</p>
                    <p className="text-xs text-muted-foreground">Design image + zone legend + materials</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="png" id="fmt-png" />
                <Label htmlFor="fmt-png" className="cursor-pointer flex items-center gap-2 flex-1">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">PNG Image</p>
                    <p className="text-xs text-muted-foreground">Canvas only, high resolution</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {format === 'pdf' && (
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Include in PDF</p>
              <div className="flex items-center justify-between">
                <Label htmlFor="legend" className="text-sm">Zone legend</Label>
                <Switch
                  id="legend"
                  checked={includeLegend}
                  onCheckedChange={setIncludeLegend}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="materials" className="text-sm">Materials summary</Label>
                <Switch
                  id="materials"
                  checked={includeMaterials}
                  onCheckedChange={setIncludeMaterials}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Exporting…</>
            ) : (
              <><Download className="h-4 w-4 mr-1.5" /> Export</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
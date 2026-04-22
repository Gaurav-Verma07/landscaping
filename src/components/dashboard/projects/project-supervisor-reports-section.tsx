"use client"

import { useRef, useState } from "react"
import { Camera, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Project } from "@/lib/project-types"
import type { SupervisorReport } from "@/lib/project-types"
import { useProjectStore } from "@/lib/project-store"
import { format } from "date-fns"
import { toast } from "sonner"

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

interface ProjectSupervisorReportsSectionProps {
  project: Project
  reports: SupervisorReport[]
}

export function ProjectSupervisorReportsSection({ project, reports }: ProjectSupervisorReportsSectionProps) {
  const { addSupervisorReport } = useProjectStore()
  const [open, setOpen] = useState(false)
  const [progressNotes, setProgressNotes] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().slice(0, 10)

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    try {
      const urls = await Promise.all(Array.from(files).map(readFileAsDataUrl))
      setPhotos((p) => [...p, ...urls])
    } catch {
      toast.error("Failed to load image(s).")
    }
    e.target.value = ""
  }

  const removePhoto = (index: number) => {
    setPhotos((p) => p.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!progressNotes.trim() && photos.length === 0) {
      toast.error("Add progress notes and/or at least one photo.")
      return
    }
    addSupervisorReport({
      projectId: project.id,
      date: today,
      progressNotes: progressNotes.trim(),
      photoUrls: photos,
      submittedBy: undefined,
    })
    toast.success("Daily report submitted.")
    setProgressNotes("")
    setPhotos([])
    setOpen(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Supervisor reports</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4 mr-2" />
          Add daily report
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Daily progress updates and required photos. Submit reports to keep the timeline and stakeholders informed.
        </p>
        {reports.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">No reports yet. Add a daily report with notes and photos.</p>
        ) : (
          <ul className="space-y-4">
            {reports.map((r) => (
              <li key={r.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>{format(new Date(r.date), "PP")}</span>
                  <span>{format(new Date(r.submittedAt), "PPp")}</span>
                </div>
                {r.progressNotes && <p className="text-sm mb-3">{r.progressNotes}</p>}
                {r.photoUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {r.photoUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-20 h-20 rounded border overflow-hidden bg-muted"
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add daily report</DialogTitle>
            <DialogDescription>
              Progress notes and daily photos for {format(new Date(today), "PP")}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Progress notes</Label>
              <Textarea
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                placeholder="What was done today? Any issues?"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Photos</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAddPhoto}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="size-4 mr-2" />
                Add photos
              </Button>
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {photos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-16 h-16 rounded border object-cover" />
                      <button
                        type="button"
                        className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground size-5 text-xs opacity-0 group-hover:opacity-100"
                        onClick={() => removePhoto(i)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

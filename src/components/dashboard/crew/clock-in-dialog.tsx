import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useClockIn } from "@/lib/hooks/use-labor"
import { useProjects } from "@/lib/hooks/use-projects"
import { AlertCircle, CheckCircle2, Loader2, MapPin, RefreshCw, XCircle } from "lucide-react"
import { useCallback, useState } from "react"
import { toast } from "sonner"

interface GpsCapture{
    lat: number
    lng: number
    accuracy: number
    verified: boolean| null
    distance: number | null
    radius: number| null
    reason?: string
}

export interface ClockInDialogProps{
    open: boolean
    onOpenChange: (open: boolean)=> void
    employeeId: string
    employeeName: string
    defaultProjectId?: string
    onSuccess?: ()=> void
}

function GpsStatusCard({gps}: {gps: GpsCapture}){
    const accuracy= `±${Math.round(gps.accuracy)}m accuracy`

    if(gps.reason === 'no_site_coords'){
        return(
            <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 p-3 space-y-0.5">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                    <AlertCircle className="size-4 shrink-0"/>
                    No site location saved for this project
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                    Location recorded but not verified. A supervisor can add site coordinates in the project settings. {accuracy}
                </p>
            </div>
        )
    }

    if(gps.verified === null){
        return(
            <div className="rounded-lg border bg-muted/40 p-3 space-y-0.5">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <AlertCircle className="size-4 shrink-0" />
                    Location captured - verification unavailable
                </div>
                <p className="text-xs text-muted-foreground">Check your connection and try again. {accuracy}</p>
            </div>
        )
    }

    if(gps.verified){
        return(
            <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 p-3 space-y-0.5">
                <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                    <CheckCircle2 className="size-4 shrink-0"/>
                    On site — verified
                </div>
                <p className="text-xs text-green-600 dark:text-green-500">
                    {gps.distance != null ? `${gps.distance}m from job site.`: ''}
                    {accuracy}
                </p>
            </div>
        )
    }

    return(
        <div className="rounded-lg border bg-red-50 dark:bg-red-950/30 p-3 space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
                <XCircle className="size-4 shrink-0"/>
                Off site — {gps.distance}m away (limit {gps.radius}m)
            </div>
            <p className="text-xs text-red-600 dark:text-red-500">
                Entry will be saved and flagged for supervisor review. {accuracy}
            </p>
        </div>
    )
}

export function ClockInDialog({
    open,
    onOpenChange,
    employeeId,
    employeeName,
    defaultProjectId,
    onSuccess
}: ClockInDialogProps){
    const {data: projects= []} = useProjects()
    const clockInMutation= useClockIn()

    const [projectId, setProjectId]= useState(defaultProjectId ?? '')
    const [notes, setNotes]= useState('')
    const [locating, setLocating]= useState(false)
    const [verifying, setVerifying]= useState(false)
    const [gps, setGps]= useState<GpsCapture | null>(null)

    //Only show projects that are actively in progress or scheduled
    const eligibleProjects= projects.filter(
        (p)=> !['Completed', 'Planned'].includes(p.status),
    )

    const reset= useCallback(()=>{
        setProjectId(defaultProjectId ??'')
        setNotes('')
        setGps(null)
        setLocating(false)
        setVerifying(false)
    }, [defaultProjectId])

    const handleProjectChange= (id: string)=>{
        setProjectId(id)
        setGps(null)
    }

    //GPS capture

    const captureLocation= useCallback(async ()=>{
        if(!projectId){
            toast.error('Select a project before capturing location')
            return
        }
        if(!navigator.geolocation){
            toast.error('Geolocation is not supported by your browser/device')
            return
        }

        setLocating(true)
        setGps(null)

        navigator.geolocation.getCurrentPosition(
            async(pos)=>{
                setLocating(false)
                setVerifying(true)
                const {latitude: lat, longitude: lng, accuracy}= pos.coords

                try{
                    const res= await fetch('/api/gps/verify', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({lat, lng, projectId}),
                    })

                    if(!res.ok) throw new Error('Verify request failed')

                    const data= await res.json()
                    setGps({
                        lat,
                        lng,
                        accuracy,
                        verified: data.verified??null,
                        distance: data.distance??null,
                        radius: data.radius??null,
                        reason: data.reason
                    })
                }catch{
                    setGps({lat, lng, accuracy, verified: null, distance: null, radius: null})
                    toast.error('Could not react the verification server — location recorded without site check')
                }
                setVerifying(false)
            },
            (err)=>{
                setLocating(false)
                const messages: Record<number, string> = {
                    1: 'Location permission denied. Enable it in your browser settings, the try again',
                    2: 'Location unavailable. Try moving to an open area or enabling GPS',
                    3: 'Location request timed out. Try again.',
                }
                toast.error(messages[err.code] ?? `Location error: ${err.message}`)
            },
            {enableHighAccuracy: true, timeout: 15_000, maximumAge: 0},
        )
    }, [projectId])

    const handleSubmit= async()=>{
        if(!projectId){
            toast.error('Select a project')
            return
        }

        const result= await clockInMutation.mutateAsync({
            employeeId,
            projectId,
            gpsVerified: gps?.verified === true,
            gpsData: gps ? {
                lat: gps.lat,
                lng: gps.lng,
                accuracyMeters: gps.accuracy,
                distanceMeters: gps.distance
            }: undefined,
            notes: notes.trim() || undefined
        })

        if('error' in result && result.error){
            toast.error(result.error as string)
            return
        }
        toast.success(`${employeeName} clocked in`)
        onSuccess?.()
        onOpenChange(false)
        reset()
    }

    const isWorking= locating || verifying || clockInMutation.isPending

    return (
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) reset()
            onOpenChange(v)
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Clock in</DialogTitle>
              <DialogDescription>{employeeName}</DialogDescription>
            </DialogHeader>
    
            <div className="space-y-4 py-1">
              {/* Project selector */}
              <Field>
                <FieldLabel>Project *</FieldLabel>
                <Select value={projectId} onValueChange={handleProjectChange} disabled={isWorking}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project…" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleProjects.length === 0 && (
                      <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                        No active projects found
                      </div>
                    )}
                    {eligibleProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span>{p.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{p.status}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
    
              {/* GPS capture */}
              <Field>
                <FieldLabel>Location</FieldLabel>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={captureLocation}
                  disabled={!projectId || isWorking}
                >
                  {locating || verifying ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : gps ? (
                    <RefreshCw className="size-4 mr-2" />
                  ) : (
                    <MapPin className="size-4 mr-2" />
                  )}
                  {locating
                    ? 'Getting location…'
                    : verifying
                      ? 'Checking against site…'
                      : gps
                        ? 'Recapture location'
                        : 'Capture my location'}
                </Button>
                {!gps && !locating && !verifying && (
                  <FieldDescription>
                    Location is optional but recommended for verification.
                  </FieldDescription>
                )}
                {gps && (
                  <div className="mt-2">
                    <GpsStatusCard gps={gps} />
                  </div>
                )}
              </Field>
    
              {/* Notes */}
              <Field>
                <FieldLabel>Notes <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything to note about this shift…"
                  rows={2}
                  disabled={isWorking}
                />
              </Field>
            </div>
    
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  reset()
                  onOpenChange(false)
                }}
                disabled={clockInMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!projectId || clockInMutation.isPending}>
                {clockInMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Clocking in…
                  </>
                ) : (
                  'Clock in'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
}

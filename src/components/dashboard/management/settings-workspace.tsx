"use client"

import * as React from "react"
import { useState } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"

import { getProfile, uploadTeamLogo, upsertProfile } from "@/lib/actions/profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { EmailConfigCard } from "./email-config-card"

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: string
  team_name: string | null
  team_logo_url: string | null
  company_phone: string | null
  company_email: string | null
  company_address: string | null
  invoice_prefix: string | null
  payment_terms_days: number
  warranty_blurb: string | null
  notify_email: boolean
  notify_sms: boolean
  voice_assistant_enabled: boolean
  voice_wake_word: string | null
  theme: string | null
  brand_color: string | null
}

function safeInitials(name: string) {
  const value = name.trim()
  if (!value) return "T"
  return value[0]!.toUpperCase()
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export function ManagementSettingsWorkspace() {
  const teamLogoInputRef = React.useRef<HTMLInputElement | null>(null)

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileRow | null>(null)

  const [teamName, setTeamName] = useState("")
  const [teamLogoFile, setTeamLogoFile] = useState<File | null>(null)
  const [teamLogoPreview, setTeamLogoPreview] = useState<string | null>(null)
  const [removeTeamLogo, setRemoveTeamLogo] = useState(false)
  const [companyPhone, setCompanyPhone] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [invoicePrefix, setInvoicePrefix] = useState("INV-")
  const [paymentTermsDays, setPaymentTermsDays] = useState(30)
  const [warrantyBlurb, setWarrantyBlurb] = useState("")
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifySms, setNotifySms] = useState(false)
  const [voiceAssistantEnabled, setVoiceAssistantEnabled] = useState(false)
  const [voiceWakeWord, setVoiceWakeWord] = useState("")
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system")
  const [brandColor, setBrandColor] = useState("")

  React.useEffect(() => {
    if (!teamLogoFile) { setTeamLogoPreview(null); return }
    const url = URL.createObjectURL(teamLogoFile)
    setTeamLogoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [teamLogoFile])

  const applyProfile = (row: ProfileRow) => {
    setProfile(row)
    setTeamName(row.team_name ?? "")
    setTeamLogoFile(null)
    setTeamLogoPreview(null)
    setRemoveTeamLogo(false)
    setCompanyPhone(row.company_phone ?? "")
    setCompanyEmail(row.company_email ?? "")
    setCompanyAddress(row.company_address ?? "")
    setInvoicePrefix(row.invoice_prefix ?? "INV-")
    setPaymentTermsDays(row.payment_terms_days ?? 30)
    setWarrantyBlurb(row.warranty_blurb ?? "")
    setNotifyEmail(row.notify_email ?? true)
    setNotifySms(row.notify_sms ?? false)
    setVoiceAssistantEnabled(row.voice_assistant_enabled ?? false)
    setVoiceWakeWord(row.voice_wake_word ?? "")
    setTheme((row.theme as "system" | "light" | "dark") ?? "system")
    setBrandColor(row.brand_color ?? "")
  }

  const loadProfile = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProfile()
      if (data) applyProfile(data as ProfileRow)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load settings.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadProfile() }, [loadProfile])

  const role = profile?.role ?? "owner"
  const canEdit = role === "owner"
  const teamLogoSrc = teamLogoPreview || (!removeTeamLogo ? profile?.team_logo_url : null)

  const onPickTeamLogoFile = (file: File | null) => {
    if (!file) { setTeamLogoFile(null); return }
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file."); return }
    if (file.size > MAX_AVATAR_BYTES) { toast.error("Image is too large (max 5 MB)."); return }
    setRemoveTeamLogo(false)
    setTeamLogoFile(file)
    toast.success("Logo selected — click Save to upload.")
  }

  const save = async () => {
    setLoading(true)
    try {
      let teamLogoUrl = removeTeamLogo ? null : (profile?.team_logo_url ?? null)
      if (teamLogoFile) {
        const fd = new FormData()
        fd.append('file', teamLogoFile)
        const uploadResult = await uploadTeamLogo(fd)
        if (uploadResult?.error) { toast.error(uploadResult.error); return }
        teamLogoUrl = uploadResult.url ?? null
      }
      const result = await upsertProfile({
        team_name: teamName.trim() || null,
        team_logo_url: teamLogoUrl,
        company_phone: companyPhone.trim() || null,
        company_email: companyEmail.trim() || null,
        company_address: companyAddress.trim() || null,
        invoice_prefix: invoicePrefix.trim() || "INV-",
        payment_terms_days: paymentTermsDays,
        warranty_blurb: warrantyBlurb.trim() || null,
        notify_email: notifyEmail,
        notify_sms: notifySms,
        voice_assistant_enabled: voiceAssistantEnabled,
        voice_wake_word: voiceWakeWord.trim() || null,
        theme: theme,
        brand_color: brandColor.trim() || null,
      })
      if (result?.error) { toast.error(result.error); return }
      await loadProfile()
      window.dispatchEvent(new CustomEvent("settings-updated"))
      toast.success("Settings saved.")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Company profile, invoice defaults, notifications, and voice settings.</p>
        </div>
        <Button onClick={save} disabled={loading || !canEdit}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">

          {/* Company profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Company profile</CardTitle>
              <CardDescription>Used on invoices and customer-facing documents.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <button
                    type="button"
                    disabled={loading || !canEdit}
                    onClick={() => teamLogoInputRef.current?.click()}
                    className="group relative rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none"
                    aria-label="Change team logo"
                  >
                    <Avatar className="h-20 w-20 rounded-xl border">
                      {teamLogoSrc ? <AvatarImage src={teamLogoSrc} alt={teamName || "Team"} /> : null}
                      <AvatarFallback className="rounded-xl text-lg">{safeInitials(teamName || "Team")}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 grid place-items-center rounded-xl bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                      <span className="text-xs font-medium">Change logo</span>
                    </div>
                  </button>
                  <input ref={teamLogoInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => onPickTeamLogoFile(e.target.files?.[0] ?? null)}
                    disabled={loading || !canEdit}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-base font-medium">{teamName || "Your team"}</div>
                    <div className="text-sm text-muted-foreground capitalize">{role}</div>
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    Only the owner can edit team settings and upload a logo.
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => teamLogoInputRef.current?.click()} disabled={loading || !canEdit}>
                      Upload logo
                    </Button>
                    <Button type="button" variant="outline" size="sm"
                      onClick={() => { setTeamLogoFile(null); setTeamLogoPreview(null); setRemoveTeamLogo(true) }}
                      disabled={loading || !canEdit || !teamLogoSrc}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-name">Company name</Label>
                <Input id="c-name" value={teamName} onChange={(e) => setTeamName(e.target.value)} disabled={loading || !canEdit} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="c-phone">Phone</Label>
                  <Input id="c-phone" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} disabled={loading || !canEdit} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c-email">Email</Label>
                  <Input id="c-email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} disabled={loading || !canEdit} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-addr">Address</Label>
                <Input id="c-addr" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} disabled={loading || !canEdit} />
              </div>
            </CardContent>
          </Card>

          {/* Invoice defaults */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice defaults</CardTitle>
              <CardDescription>Controls invoice numbering and default terms.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="inv-prefix">Invoice prefix</Label>
                  <Input id="inv-prefix" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} disabled={loading || !canEdit} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="terms">Payment terms (days)</Label>
                  <Input id="terms" inputMode="numeric" value={String(paymentTermsDays)} onChange={(e) => setPaymentTermsDays(Number(e.target.value) || 0)} disabled={loading || !canEdit} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="warranty">Warranty blurb</Label>
                <Textarea id="warranty" rows={4} value={warrantyBlurb} onChange={(e) => setWarrantyBlurb(e.target.value)} placeholder="Workmanship warranty: ..." disabled={loading || !canEdit} />
              </div>
            </CardContent>
          </Card>

          {/* Email config — self-contained, has its own Save button */}
          <EmailConfigCard canEdit={canEdit} />

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>System alerts for your team.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label>Email notifications</Label>
                  <div className="text-xs text-muted-foreground">Invoice reminders, overdue alerts, and system notices.</div>
                </div>
                <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} disabled={loading || !canEdit} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label>SMS notifications</Label>
                  <div className="text-xs text-muted-foreground">Useful for storm operations and dispatch.</div>
                </div>
                <Switch checked={notifySms} onCheckedChange={setNotifySms} disabled={loading || !canEdit} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Voice assistant */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Voice assistant</CardTitle>
              <CardDescription>Helper for navigation and quick actions.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label>Enabled</Label>
                  <div className="text-xs text-muted-foreground">Turn off to disable voice features.</div>
                </div>
                <Switch checked={voiceAssistantEnabled} onCheckedChange={setVoiceAssistantEnabled} disabled={loading || !canEdit} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wake">Wake word</Label>
                <Input id="wake" value={voiceWakeWord} onChange={(e) => setVoiceWakeWord(e.target.value)} placeholder="e.g. Landscaping" disabled={loading || !canEdit || !voiceAssistantEnabled} />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>Theme + brand color.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={(v: "system" | "light" | "dark") => setTheme(v)} disabled={loading || !canEdit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="brand">Brand color</Label>
                <Input id="brand" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} placeholder="#0ea5e9" disabled={loading || !canEdit} />
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">All settings are synced with your Supabase database.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
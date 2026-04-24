"use client"

import * as React from "react"
import { useState } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"

import { useUserStore } from "@/store/use-user-store"
import { getProfile, upsertProfile } from "@/app/actions/profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type ProfileSettings = {
  id: string
  team_name: string | null
  team_logo_url: string | null
  role: string | null
  company_phone: string | null
  company_email: string | null
  company_address: string | null
  invoice_prefix: string | null
  payment_terms_days: number | null
  warranty_blurb: string | null
  notify_email: boolean | null
  notify_sms: boolean | null
  voice_assistant_enabled: boolean | null
  voice_wake_word: string | null
  theme: string | null
  brand_color: string | null
}

function safeInitials(name: string) {
  const value = name.trim()
  if (!value) return "T"
  return value[0]!.toUpperCase()
}

function fileExt(fileName: string) {
  const parts = fileName.split(".")
  if (parts.length < 2) return "png"
  return parts[parts.length - 1]!.toLowerCase()
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

const defaultSettings: Omit<ProfileSettings, "id"> = {
  team_name: null,
  team_logo_url: null,
  role: "owner",
  company_phone: null,
  company_email: null,
  company_address: null,
  invoice_prefix: "INV-",
  payment_terms_days: 30,
  warranty_blurb: null,
  notify_email: true,
  notify_sms: false,
  voice_assistant_enabled: true,
  voice_wake_word: "Landscaping",
  theme: "system",
  brand_color: null,
}

export function ManagementSettingsWorkspace() {
  const teamLogoInputRef = React.useRef<HTMLInputElement | null>(null)
  const userId = useUserStore((s) => s.user?.id)

  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<ProfileSettings | null>(null)
  
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
  const [voiceAssistantEnabled, setVoiceAssistantEnabled] = useState(true)
  const [voiceWakeWord, setVoiceWakeWord] = useState("Landscaping")
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system")
  const [brandColor, setBrandColor] = useState("")

  const loadProfile = React.useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setTeamName("")
      setCompanyPhone("")
      setCompanyEmail("")
      setCompanyAddress("")
      setInvoicePrefix("INV-")
      setPaymentTermsDays(30)
      setWarrantyBlurb("")
      setNotifyEmail(true)
      setNotifySms(false)
      setVoiceAssistantEnabled(true)
      setVoiceWakeWord("Landscaping")
      setTheme("system")
      setBrandColor("")
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getProfile(userId)
      const row: ProfileSettings = data
        ? {
            id: data.id,
            team_name: data.teamName ?? null,
            team_logo_url: data.teamLogoUrl ?? null,
            role: data.role ?? "owner",
            company_phone: data.companyPhone ?? null,
            company_email: data.companyEmail ?? null,
            company_address: data.companyAddress ?? null,
            invoice_prefix: data.invoicePrefix ?? "INV-",
            payment_terms_days: data.paymentTermsDays ?? 30,
            warranty_blurb: data.warrantyBlurb ?? null,
            notify_email: data.notifyEmail ?? true,
            notify_sms: data.notifySms ?? false,
            voice_assistant_enabled: data.voiceAssistantEnabled ?? true,
            voice_wake_word: data.voiceWakeWord ?? "Landscaping",
            theme: data.theme as string | null,
            brand_color: data.brandColor ?? null,
          }
        : { id: userId, ...defaultSettings }
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
      setVoiceAssistantEnabled(row.voice_assistant_enabled ?? true)
      setVoiceWakeWord(row.voice_wake_word ?? "Landscaping")
      setTheme((row.theme as "system" | "light" | "dark") ?? "system")
      setBrandColor(row.brand_color ?? "")
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load settings."
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const role = profile?.role || "owner"
  const canEditTeam = role === "owner"
  const teamLogoSrc = teamLogoPreview || profile?.team_logo_url || null

  React.useEffect(() => {
    if (!teamLogoFile) {
      setTeamLogoPreview(null)
      return
    }
    const url = URL.createObjectURL(teamLogoFile)
    setTeamLogoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [teamLogoFile])

  React.useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const onPickTeamLogoFile = (file: File | null) => {
    if (!file) {
      setTeamLogoFile(null)
      return
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image is too large (max 5MB).")
      return
    }
    setRemoveTeamLogo(false)
    setTeamLogoFile(file)
    toast.success("Logo selected. Click Save to upload.")
  }

  const save = async () => {
    if (!userId) {
      toast.error("Auth not configured.")
      return
    }
    if (!canEditTeam) {
      toast.error("Only the owner can update settings.")
      return
    }
    setLoading(true)
    try {
      const nameTrimmed = teamName.trim() || null
      const teamLogoUrl = removeTeamLogo ? null : (profile?.team_logo_url ?? null)

      await upsertProfile(userId, {
        teamName: nameTrimmed,
        teamLogoUrl,
        companyPhone: companyPhone.trim() || null,
        companyEmail: companyEmail.trim() || null,
        companyAddress: companyAddress.trim() || null,
        invoicePrefix: invoicePrefix.trim() || "INV-",
        paymentTermsDays: paymentTermsDays,
        warrantyBlurb: warrantyBlurb.trim() || null,
        notifyEmail,
        notifySms,
        voiceAssistantEnabled,
        voiceWakeWord: voiceWakeWord.trim() || "Landscaping",
        theme,
        brandColor: brandColor.trim() || null,
      })

      setProfile((current) =>
        current
          ? {
              ...current,
              team_name: nameTrimmed,
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
              voice_wake_word: voiceWakeWord.trim() || "Landscaping",
              theme: theme,
              brand_color: brandColor.trim() || null,
            }
          : current
      )
      setTeamLogoFile(null)
      setRemoveTeamLogo(false)
      window.dispatchEvent(new CustomEvent("settings-updated"))
      toast.success("Settings saved.")
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save settings."
      toast.error(message)
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
        <Button onClick={save} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
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
                    disabled={loading || !canEditTeam}
                    onClick={() => teamLogoInputRef.current?.click()}
                    className="group relative rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none"
                    aria-label="Change team logo"
                  >
                    <Avatar className="h-20 w-20 rounded-xl border">
                      {!removeTeamLogo && teamLogoSrc ? (
                        <AvatarImage src={teamLogoSrc} alt={teamName || "Team"} />
                      ) : null}
                      <AvatarFallback className="rounded-xl text-lg">{safeInitials(teamName || "Team")}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 grid place-items-center rounded-xl bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                      <span className="text-xs font-medium">Change logo</span>
                    </div>
                  </button>
                  <input
                    ref={teamLogoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickTeamLogoFile(e.target.files?.[0] ?? null)}
                    disabled={loading || !canEditTeam}
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => teamLogoInputRef.current?.click()}
                      disabled={loading || !canEditTeam}
                    >
                      Upload logo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTeamLogoFile(null)
                        setTeamLogoPreview(null)
                        setRemoveTeamLogo(true)
                      }}
                      disabled={loading || !canEditTeam || !teamLogoSrc}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-name">Company name</Label>
                <Input
                  id="c-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  disabled={loading || !canEditTeam}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="c-phone">Phone</Label>
                  <Input
                    id="c-phone"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    disabled={loading || !canEditTeam}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c-email">Email</Label>
                  <Input
                    id="c-email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    disabled={loading || !canEditTeam}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-addr">Address</Label>
                <Input
                  id="c-addr"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  disabled={loading || !canEditTeam}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice defaults</CardTitle>
              <CardDescription>Controls invoice numbering and default terms.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="inv-prefix">Invoice prefix</Label>
                  <Input
                    id="inv-prefix"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    disabled={loading || !canEditTeam}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="terms">Payment terms (days)</Label>
                  <Input
                    id="terms"
                    inputMode="numeric"
                    value={String(paymentTermsDays)}
                    onChange={(e) => setPaymentTermsDays(Number(e.target.value) || 0)}
                    disabled={loading || !canEditTeam}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="warranty">Warranty blurb</Label>
                <Textarea
                  id="warranty"
                  rows={4}
                  value={warrantyBlurb}
                  onChange={(e) => setWarrantyBlurb(e.target.value)}
                  placeholder="Workmanship warranty: ..."
                  disabled={loading || !canEditTeam}
                />
              </div>
            </CardContent>
          </Card>

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
                <Switch
                  checked={notifyEmail}
                  onCheckedChange={setNotifyEmail}
                  disabled={loading || !canEditTeam}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label>SMS notifications</Label>
                  <div className="text-xs text-muted-foreground">Useful for storm operations and dispatch.</div>
                </div>
                <Switch
                  checked={notifySms}
                  onCheckedChange={setNotifySms}
                  disabled={loading || !canEditTeam}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
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
                <Switch
                  checked={voiceAssistantEnabled}
                  onCheckedChange={setVoiceAssistantEnabled}
                  disabled={loading || !canEditTeam}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wake">Wake word</Label>
                <Input
                  id="wake"
                  value={voiceWakeWord}
                  onChange={(e) => setVoiceWakeWord(e.target.value)}
                  placeholder="Landscaping"
                  disabled={loading || !canEditTeam || !voiceAssistantEnabled}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>Theme + brand color.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Theme</Label>
                <Select
                  value={theme}
                  onValueChange={(v: "system" | "light" | "dark") => setTheme(v)}
                  disabled={loading || !canEditTeam}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="brand">Brand color</Label>
                <Input
                  id="brand"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#0ea5e9"
                  disabled={loading || !canEditTeam}
                />
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">
                All settings are synced with your Supabase database.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

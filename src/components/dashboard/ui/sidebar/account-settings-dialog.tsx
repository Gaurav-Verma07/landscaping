"use client"

import * as React from "react"
import { toast } from "sonner"
import { Camera, Loader2, Mail, Trash2, Upload, User } from "lucide-react"

import { useUserStore } from "@/store/use-user-store"
import { getProfile, removeAvatar, updateAuthEmail, uploadAvatar, upsertProfile } from "@/lib/actions/profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"


type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name?: string | null): string {
  if (!name?.trim()) return "U"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export function AccountSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const storeUser = useUserStore((s) => s.user)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const [loadingProfile, setLoadingProfile] = React.useState(false)
  const [savingName, setSavingName] = React.useState(false)
  const [savingEmail, setSavingEmail] = React.useState(false)
  const [savingAvatar, setSavingAvatar] = React.useState(false)

  const [profile, setProfile] = React.useState<ProfileRow | null>(null)
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open || !storeUser?.id) return
    let cancelled = false

    const run = async () => {
      setLoadingProfile(true)
      try {
        const data = await getProfile()
        const row: ProfileRow = data
          ? {
              id: data.id,
              email: data.email ?? null,
              full_name: data.full_name ?? null,
              avatar_url: data.avatar_url ?? null,
              role: data.role ?? "owner",
            }
          : {
              id: storeUser.id,
              email: storeUser.email ?? null,
              full_name: null,
              avatar_url: null,
              role: "owner",
            }
        if (cancelled) return
        setProfile(row)
        setFullName(row.full_name ?? "")
        setEmail(row.email ?? storeUser.email ?? "")
        setSelectedFile(null)
        setPreviewUrl(null)
      } catch (e: unknown) {
        if (!cancelled)
          toast.error(e instanceof Error ? e.message : "Failed to load account settings.")
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [open, storeUser?.id])

  React.useEffect(() => {
    if (!selectedFile) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedFile])

  const onPickFile = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file."); return }
    if (file.size > MAX_AVATAR_BYTES) { toast.error("Image must be under 5 MB."); return }
    setSelectedFile(file)
  }

  const handleSaveName = async () => {
    if (!storeUser?.id) return
    setSavingName(true)
    try {
      const result = await upsertProfile({ full_name: fullName.trim() || null })
      if (result && "error" in result) throw new Error(result.error ?? "Failed to save name.")
      setProfile((p) => p ? { ...p, full_name: fullName.trim() || null } : p)
      toast.success("Name updated.")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update name.")
    } finally {
      setSavingName(false)
    }
  }

  const handleSaveEmail = async () => {
    const trimmed = email.trim()
    if (!trimmed) { toast.error("Email cannot be empty."); return }
    if (trimmed === (profile?.email ?? storeUser?.email)) {
      toast("That's already your current email.")
      return
    }
    setSavingEmail(true)
    try {
      const result = await updateAuthEmail(trimmed)
      if ("error" in result) throw new Error(result.error)
      toast.success("Confirmation sent — check your new inbox to confirm the change.")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update email.")
    } finally {
      setSavingEmail(false)
    }
  }

  const handleUploadAvatar = async () => {
    if (!selectedFile) return
    setSavingAvatar(true)
    try {
      const fd = new FormData()
      fd.append("file", selectedFile)
      const result = await uploadAvatar(fd)
      if ("error" in result) throw new Error(result.error)
      setProfile((p) => p ? { ...p, avatar_url: result.url } : p)
      setSelectedFile(null)
      toast.success("Profile photo updated.")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to upload photo.")
    } finally {
      setSavingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setSavingAvatar(true)
    try {
      const result = await removeAvatar()
      if ("error" in result) throw new Error(result.error)
      setProfile((p) => p ? { ...p, avatar_url: null } : p)
      setSelectedFile(null)
      toast.success("Profile photo removed.")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to remove photo.")
    } finally {
      setSavingAvatar(false)
    }
  }

  const displayName =
    fullName.trim() ||
    profile?.email?.split("@")[0] ||
    storeUser?.email?.split("@")[0] ||
    "User"

  const avatarSrc = previewUrl ?? profile?.avatar_url ?? null
  const role = profile?.role ?? "member"
  const hasAvatarChange = !!selectedFile
  const hasAvatar = !!profile?.avatar_url

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>
            Manage your profile info. Email changes require confirmation.
          </DialogDescription>
        </DialogHeader>

        {loadingProfile ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-2 space-y-6">

            {/* ── Avatar ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-5">
              <button
                type="button"
                disabled={savingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="group relative shrink-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none"
                aria-label="Change profile photo"
              >
                <Avatar className="h-20 w-20 rounded-2xl border-2 border-border">
                  {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName} />}
                  <AvatarFallback className="rounded-2xl text-xl font-semibold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                  {savingAvatar
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <Camera className="h-5 w-5" />
                  }
                </div>
              </button>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-base font-semibold">{displayName}</span>
                  <Badge variant="secondary" className="capitalize text-xs">{role}</Badge>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {profile?.email || storeUser?.email || ""}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {hasAvatarChange ? (
                    <>
                      <Button size="sm" onClick={handleUploadAvatar} disabled={savingAvatar}>
                        {savingAvatar
                          ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          : <Upload className="mr-1.5 h-3.5 w-3.5" />
                        }
                        Save photo
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={savingAvatar}
                        onClick={() => setSelectedFile(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={savingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        {hasAvatar ? "Change photo" : "Upload photo"}
                      </Button>
                      {hasAvatar && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingAvatar}
                          onClick={handleRemoveAvatar}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Remove
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="acct-full-name" className="flex items-center gap-1.5 text-sm font-medium">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Full Name
              </Label>
              <div className="flex gap-2">
                <Input
                  id="acct-full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  disabled={savingName}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
                <Button
                  onClick={handleSaveName}
                  disabled={savingName || fullName.trim() === (profile?.full_name ?? "")}
                >
                  {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>

            {/* ── Email ──────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label htmlFor="acct-email" className="flex items-center gap-1.5 text-sm font-medium">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address
              </Label>
              <div className="flex gap-2">
                <Input
                  id="acct-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={savingEmail}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEmail()}
                />
                <Button
                  onClick={handleSaveEmail}
                  disabled={
                    savingEmail ||
                    !email.trim() ||
                    email.trim() === (profile?.email ?? storeUser?.email ?? "")
                  }
                >
                  {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A confirmation link will be sent to the new address before the change takes effect.
              </p>
            </div>

          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
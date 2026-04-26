"use client"

import * as React from "react"
import { toast } from "sonner"

import { useUserStore } from "@/store/use-user-store"
import { getProfile, upsertProfile } from "@/app/actions/profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: string | null
}

function safeInitials(nameOrEmail: string) {
  const s = nameOrEmail.trim()
  if (!s) return "U"
  return s[0]!.toUpperCase()
}

function fileExt(fileName: string) {
  const parts = fileName.split(".")
  if (parts.length < 2) return "png"
  return parts[parts.length - 1]!.toLowerCase()
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

  const [loading, setLoading] = React.useState(false)
  const [profile, setProfile] = React.useState<ProfileRow | null>(null)

  const [fullName, setFullName] = React.useState("")
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = React.useState(false)

  React.useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedFile])

  React.useEffect(() => {
    if (!open || !storeUser?.id) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      try {
        const data = await getProfile()
        const row: ProfileRow = data
          ? {
              id: data.id,
              email: data.email ?? null,
              full_name: data.fullName ?? null,
              avatar_url: data.avatarUrl ?? null,
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
        setSelectedFile(null)
        setPreviewUrl(null)
        setRemoveAvatar(false)
      } catch (e: unknown) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load account settings.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [open, storeUser?.id])

  const onPickAvatarFile = (file: File | null) => {
    if (!file) {
      setSelectedFile(null)
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
    setRemoveAvatar(false)
    setSelectedFile(file)
  }

  const handleSave = async () => {
    if (!storeUser?.id) {
      toast.error("Auth not configured.")
      return
    }
    setLoading(true)
    try {
      const nameTrimmed = fullName.trim() || null
      const avatarUrl = removeAvatar ? null : (profile?.avatar_url ?? null)

      await upsertProfile({
        email: storeUser.email ?? null,
        full_name: nameTrimmed,
        avatar_url: avatarUrl,
      })
      toast.success("Account updated.")
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update account.")
    } finally {
      setLoading(false)
    }
  }

  const displayName =
    fullName.trim() ||
    profile?.email?.split("@")[0] ||
    storeUser?.email?.split("@")[0] ||
    "User"

  const avatarSrc = previewUrl || profile?.avatar_url || null
  const role = (profile?.role || "member") as string
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>Update your profile name and photo.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <button
                type="button"
                disabled={loading}
                onClick={() => fileInputRef.current?.click()}
                className="group relative rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none"
                aria-label="Change profile picture"
              >
                  <Avatar className="h-20 w-20 rounded-xl border">
                    {!removeAvatar && avatarSrc ? <AvatarImage src={avatarSrc} alt={displayName} /> : null}
                    <AvatarFallback className="rounded-xl text-lg">{safeInitials(displayName)}</AvatarFallback>
                  </Avatar>
                <div className="absolute inset-0 grid place-items-center rounded-xl bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                  <span className="text-xs font-medium">Change photo</span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickAvatarFile(e.target.files?.[0] ?? null)}
                disabled={loading}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-base font-medium">{displayName}</div>
                <Badge variant="secondary" className="capitalize">
                  {role}
                </Badge>
              </div>
              <div className="truncate text-sm text-muted-foreground">{profile?.email || storeUser?.email || ""}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  Upload new
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                    setRemoveAvatar(true)
                  }}
                  disabled={loading || !profile?.avatar_url}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="acct-full-name">Name</Label>
              <Input
                id="acct-full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


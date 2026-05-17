'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Listen for the PASSWORD_RECOVERY event — Supabase fires this
    // automatically when it detects a recovery token in the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true)
      }
    })

    // Also check if we already have a session (code was exchanged by callback route)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords do not match"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push("/dashboard")
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card className="p-0 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            {!ready ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Image src="/landscraping_logo.png" alt="Landscaping" width={36} height={36} className="size-9 object-contain" priority />
                    <span className="text-base font-medium">Landscaping</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center mb-2">
                    <h1 className="text-2xl font-bold">Set new password</h1>
                    <p className="text-muted-foreground text-sm">Must be at least 8 characters.</p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                    <Input
                      id="new-password"
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                    />
                  </Field>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Field>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Reset password"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
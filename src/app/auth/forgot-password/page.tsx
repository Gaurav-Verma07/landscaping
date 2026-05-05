"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert("Password updated successfully")
      window.location.href = "/dashboard"
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 w-80">
        <h2 className="text-xl font-semibold">Reset Password</h2>
        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button onClick={handleReset} disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </div>
  )
}
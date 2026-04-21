'use client'

import { Mail } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FieldDescription } from "@/components/ui/field"

import { useSearchParams } from "next/navigation"

export function PendingForm({ ...props }: React.ComponentProps<typeof Card>) {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  return (
    <Card {...props}>
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription className="text-base">
            We&apos;ve sent a verification link to your email address
        </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {email && (
          <div className="rounded-lg border bg-muted/50 p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Sent to
            </p>
            <p className="mt-1 text-sm font-semibold">{email}</p>
          </div>
        )}
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Click the verification link in the email to complete your signup.
            The link will expire in 24 hours.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="outline" className="w-full" asChild>
              <a href="#">Resend verification email</a>
            </Button>
            <FieldDescription className="text-xs">
              Didn&apos;t receive it? Check your spam folder or try resending.
            </FieldDescription>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

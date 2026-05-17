'use client'

import { cn } from "@/utils/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { login, resetPassword } from "@/app/auth/actions"
import { useActionState, useState } from "react"
import { ArrowLeft, Mail } from "lucide-react"

type ActionState = {
  error?: string
  success?: boolean
} | null

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [view, setView] = useState<"login" | "forgot" | "sent">("login")
  const [resetEmail, setResetEmail] = useState("")

  const [loginState, loginAction, loginPending] = useActionState(login, null) as unknown as [
    ActionState, (payload: FormData) => void, boolean
  ]
  const [resetState, resetAction, resetPending] = useActionState(
    async (s: unknown, fd: FormData) => {
      const result = await resetPassword(s, fd)
      if (result?.success) setView("sent")
      return result
    },
    null
  ) as unknown as [ActionState, (payload: FormData) => void, boolean]

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">

          {/* ── LEFT PANEL ── */}
          <div className="p-6 md:p-8">

            {/* LOGIN VIEW */}
            {view === "login" && (
              <form action={loginAction}>
                <FieldGroup>
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-foreground/90 hover:text-foreground transition-colors"
                  >
                    <Image src="/landscraping_logo.png" alt="Landscaping" width={40} height={40} className="size-9 object-contain" priority />
                    <span className="text-base">Landscaping</span>
                  </Link>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Welcome back</h1>
                    <p className="text-muted-foreground text-balance">Login to your Landscaping account</p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                  </Field>
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <button
                        type="button"
                        onClick={() => setView("forgot")}
                        className="ml-auto text-sm underline-offset-2 hover:underline text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input id="password" name="password" type="password" required />
                  </Field>
                  {loginState?.error && <p className="text-sm text-red-500">{loginState.error}</p>}
                  <Field>
                    <Button type="submit" disabled={loginPending}>
                      {loginPending ? "Logging in..." : "Login"}
                    </Button>
                  </Field>
                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or continue with</FieldSeparator>
                  <Field className="grid gap-4">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          window.location.href = '/auth/google'
                        }}
                      >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor" /></svg>
                        Continue with google
                      </Button>
                  </Field>
                  <FieldDescription className="text-center">
                    Don&apos;t have an account? <a href="/auth/signup">Sign up</a>
                  </FieldDescription>
                </FieldGroup>
              </form>
            )}

            {/* FORGOT PASSWORD VIEW */}
            {view === "forgot" && (
              <form action={resetAction}>
                <FieldGroup>
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-foreground/90 hover:text-foreground transition-colors"
                  >
                    <Image src="/landscraping_logo.png" alt="Landscaping" width={40} height={40} className="size-9 object-contain" priority />
                    <span className="text-base">Landscaping</span>
                  </Link>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Reset your password</h1>
                    <p className="text-muted-foreground text-balance text-sm">
                      Enter your email and we&apos;ll send you a reset link.
                    </p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="reset-email">Email</FieldLabel>
                    <Input
                      id="reset-email"
                      name="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </Field>
                  {resetState?.error && <p className="text-sm text-red-500">{resetState.error}</p>}
                  <Field>
                    <Button type="submit" disabled={resetPending}>
                      {resetPending ? "Sending..." : "Send reset link"}
                    </Button>
                  </Field>
                  <Field>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setView("login")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to login
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            )}

            {/* EMAIL SENT VIEW */}
            {view === "sent" && (
              <FieldGroup>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-foreground/90 hover:text-foreground transition-colors"
                >
                  <Image src="/landscraping_logo.png" alt="Landscaping" width={40} height={40} className="size-9 object-contain" priority />
                  <span className="text-base">Landscaping</span>
                </Link>
                <div className="flex flex-col items-center gap-4 text-center py-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-7 w-7 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold">Check your email</h2>
                    <p className="text-muted-foreground text-sm text-balance">
                      We sent a password reset link to
                    </p>
                    {resetEmail && (
                      <p className="text-sm font-semibold">{resetEmail}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The link expires in 1 hour. Check your spam if you don&apos;t see it.
                  </p>
                </div>
                <Field>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setView("forgot")
                    }}
                  >
                    Resend email
                  </Button>
                </Field>
                <Field>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setView("login")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Button>
                </Field>
              </FieldGroup>
            )}
          </div>

          {/* RIGHT PANEL — hero image */}
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/hero-image.png"
              alt="Hero image"
              loading="eager"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
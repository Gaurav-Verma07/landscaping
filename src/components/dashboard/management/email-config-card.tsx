'use client'

import { useState, useEffect } from 'react'
import { Mail, Eye, EyeOff, Loader2, CheckCircle2, XCircle, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getProfile, upsertProfile } from '@/lib/actions/profile'
import { testSmtpConnection } from '@/lib/actions/email'

const SMTP_PRESETS = [
  { label: 'Gmail', host: 'smtp.gmail.com', port: 587 },
  { label: 'Outlook / Hotmail', host: 'smtp.office365.com', port: 587 },
  { label: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 587 },
  { label: 'Custom', host: '', port: 587 },
]

interface EmailConfigCardProps {
  canEdit: boolean
}

export function EmailConfigCard({ canEdit }: EmailConfigCardProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [preset, setPreset] = useState('Gmail')
  const [host, setHost] = useState('smtp.gmail.com')
  const [port, setPort] = useState(587)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fromName, setFromName] = useState('')
  const [configured, setConfigured] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await getProfile()
        if (data) {
          const p = data as any
          setHost(p.smtp_host ?? 'smtp.gmail.com')
          setPort(p.smtp_port ?? 587)
          setEmail(p.smtp_email ?? '')
          setPassword(p.smtp_password ?? '')
          setFromName(p.smtp_from_name ?? '')
          setConfigured(!!(p.smtp_host && p.smtp_email && p.smtp_password))
          const match = SMTP_PRESETS.find(x => x.host === (p.smtp_host ?? 'smtp.gmail.com'))
          setPreset(match?.label ?? 'Custom')
        }
      } catch {
        toast.error('Failed to load email settings.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handlePresetChange = (label: string) => {
    setPreset(label)
    const match = SMTP_PRESETS.find(p => p.label === label)
    if (match?.host) {
      setHost(match.host)
      setPort(match.port)
    }
    setTestResult(null)
  }

  const handleTest = async () => {
    if (!host || !email || !password) {
      toast.error('Fill in all fields before testing.')
      return
    }
    setTesting(true)
    setTestResult(null)
    const result = await testSmtpConnection(host, port, email, password)
    if (result.success) {
      setTestResult('success')
      toast.success('SMTP connection successful!')
    } else {
      setTestResult('error')
      toast.error(`Connection failed: ${result.error}`)
    }
    setTesting(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await upsertProfile({
        smtp_host: host.trim() || null,
        smtp_port: port,
        smtp_email: email.trim() || null,
        smtp_password: password.trim() || null,
        smtp_from_name: fromName.trim() || null,
      })
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setConfigured(!!(host && email && password))
      toast.success('Email settings saved.')
    } catch {
      toast.error('Failed to save email settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card id="email_config">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="size-4" />
              Email configuration
            </CardTitle>
            <CardDescription>
              Configure your email to send outreach messages to prospects.
            </CardDescription>
          </div>
          {configured && (
            <Badge variant="default" className="shrink-0">
              <CheckCircle2 className="size-3 mr-1" />
              Configured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">

        {/* Provider preset */}
        <div className="grid gap-2">
          <Label>Email provider</Label>
          <Select value={preset} onValueChange={handlePresetChange} disabled={loading || !canEdit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SMTP_PRESETS.map((p) => (
                <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gmail help */}
        {preset === 'Gmail' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-3 text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <p className="font-medium">Gmail requires an App Password:</p>
            <p>1. Enable 2-Step Verification on your Google account</p>
            <p>2. Go to Google Account → Security → App Passwords</p>
            <p>3. Generate a password for "Mail"</p>
            <p>4. Use that password below (not your regular Gmail password)</p>
          </div>
        )}

        {/* Host + port */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 grid gap-2">
            <Label htmlFor="smtp-host">SMTP host</Label>
            <Input
              id="smtp-host"
              value={host}
              onChange={(e) => { setHost(e.target.value); setTestResult(null) }}
              placeholder="smtp.gmail.com"
              disabled={loading || !canEdit}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="smtp-port">Port</Label>
            <Input
              id="smtp-port"
              inputMode="numeric"
              value={String(port)}
              onChange={(e) => { setPort(Number(e.target.value) || 587); setTestResult(null) }}
              disabled={loading || !canEdit}
            />
          </div>
        </div>

        {/* Email + display name */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="smtp-email">Email address</Label>
            <Input
              id="smtp-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setTestResult(null) }}
              placeholder="you@gmail.com"
              disabled={loading || !canEdit}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="smtp-from-name">Display name</Label>
            <Input
              id="smtp-from-name"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="e.g. Landscaping"
              disabled={loading || !canEdit}
            />
          </div>
        </div>

        {/* Password */}
        <div className="grid gap-2">
          <Label htmlFor="smtp-password">
            {preset === 'Gmail' ? 'App password' : 'Password'}
          </Label>
          <div className="relative">
            <Input
              id="smtp-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setTestResult(null) }}
              placeholder="••••••••••••••••"
              disabled={loading || !canEdit}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={loading || !canEdit || testing || !host || !email || !password}
          >
            {testing ? (
              <><Loader2 className="size-4 mr-2 animate-spin" />Testing...</>
            ) : 'Test connection'}
          </Button>

          {testResult === 'success' && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="size-4" /> Connected successfully
            </span>
          )}
          {testResult === 'error' && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <XCircle className="size-4" /> Connection failed
            </span>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={loading || !canEdit || saving || testResult !== 'success'}
            className="ml-auto"
          >
            {saving ? (
              <><Loader2 className="size-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="size-4 mr-2" />Save email settings</>
            )}
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, Copy, Check, Loader2, Facebook, Instagram, Linkedin, CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Platform } from '@/lib/actions/social-posts'

const PLATFORMS = [
  { id: 'facebook' as Platform,  label: 'Facebook',  icon: Facebook,  color: 'text-blue-600',  maxChars: 500  },
  { id: 'instagram' as Platform, label: 'Instagram', icon: Instagram, color: 'text-pink-500',  maxChars: 300  },
  { id: 'linkedin' as Platform,  label: 'LinkedIn',  icon: Linkedin,  color: 'text-blue-700',  maxChars: 600  },
]

const THEMES = [
  'Spring cleanup offer',
  'Summer lawn care tips',
  'Autumn leaf clearance',
  'Winter garden prep',
  'Storm damage clearance',
  'Before & after job showcase',
  'Seasonal promotion / discount',
  'Team introduction',
  'Customer testimonial highlight',
  'Free quote promotion',
  'Custom...',
]

interface GeneratedPost {
  platform: Platform
  content: string
  hashtags: string[]
}

interface SocialPostGeneratorProps {
  onSaveToCalendar?: (post: { platform: Platform; content: string; hashtags: string[] }) => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard.')
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <><Check className="size-3.5 mr-1.5" />Copied</> : <><Copy className="size-3.5 mr-1.5" />Copy</>}
    </Button>
  )
}

export function SocialPostGenerator({ onSaveToCalendar }: SocialPostGeneratorProps) {
  const [theme, setTheme] = useState('')
  const [customTheme, setCustomTheme] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [posts, setPosts] = useState<GeneratedPost[]>([])

  const effectiveTheme = theme === 'Custom...' ? customTheme : theme

  const handleGenerate = async () => {
    if (!effectiveTheme.trim()) { toast.error('Choose or describe a theme first.'); return }
    setGenerating(true)
    setPosts([])
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `You are a social media manager for a landscaping business${companyName ? ` called "${companyName}"` : ''}.

Generate social media posts for the following theme: "${effectiveTheme}"

Create one post for each platform with appropriate tone and length:
- Facebook: conversational, community-focused, up to 500 characters
- Instagram: visual, energetic, emoji-friendly, up to 300 characters
- LinkedIn: professional, business-focused, up to 600 characters

Each post should feel native to its platform. Include relevant hashtags separately.

Respond ONLY with a JSON array, no markdown, no preamble:
[
  {"platform": "facebook", "content": "post text here", "hashtags": ["#tag1", "#tag2"]},
  {"platform": "instagram", "content": "post text here", "hashtags": ["#tag1", "#tag2"]},
  {"platform": "linkedin", "content": "post text here", "hashtags": ["#tag1", "#tag2"]}
]`,
          }],
        }),
      })
      const data = await response.json()
      const text = data.content?.[0]?.text ?? ''
      const parsed: GeneratedPost[] = JSON.parse(text.replace(/```json|```/g, '').trim())
      setPosts(parsed)
      toast.success('Posts generated.')
    } catch {
      toast.error('Failed to generate posts. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Input panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            AI social post generator
          </CardTitle>
          <CardDescription>
            Describe your theme and Claude writes platform-optimised posts for Facebook, Instagram, and LinkedIn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger><SelectValue placeholder="Choose a theme..." /></SelectTrigger>
                <SelectContent>
                  {THEMES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Company name <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Landscaping"
              />
            </div>
          </div>

          {theme === 'Custom...' && (
            <div className="space-y-2">
              <Label>Describe your post</Label>
              <Input
                value={customTheme}
                onChange={e => setCustomTheme(e.target.value)}
                placeholder="e.g. We just completed a full garden redesign for a client in Manchester"
              />
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generating || !effectiveTheme.trim()}>
            {generating
              ? <><Loader2 className="size-4 mr-2 animate-spin" />Generating...</>
              : <><Sparkles className="size-4 mr-2" />Generate posts</>}
          </Button>
        </CardContent>
      </Card>

      {/* Generated posts */}
      {posts.length > 0 && (
        <Tabs defaultValue="facebook">
          <TabsList>
            {PLATFORMS.map(p => (
              <TabsTrigger key={p.id} value={p.id} className="flex items-center gap-1.5">
                <p.icon className={`size-3.5 ${p.color}`} />
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {PLATFORMS.map(p => {
            const post = posts.find(x => x.platform === p.id)
            if (!post) return null
            const fullText = post.content + '\n\n' + post.hashtags.join(' ')
            const charCount = post.content.length
            const overLimit = charCount > p.maxChars
            return (
              <TabsContent key={p.id} value={p.id}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <p.icon className={`size-4 ${p.color}`} />
                        <CardTitle className="text-sm">{p.label}</CardTitle>
                        <span className={`text-xs ${overLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {charCount}/{p.maxChars}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onSaveToCalendar && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onSaveToCalendar({ platform: p.id, content: post.content, hashtags: post.hashtags })
                              toast.success('Opening calendar to schedule this post.')
                            }}
                          >
                            <CalendarPlus className="size-3.5 mr-1.5" />
                            Save to calendar
                          </Button>
                        )}
                        <CopyButton text={fullText} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={post.content}
                      onChange={e => setPosts(prev => prev.map(x =>
                        x.platform === p.id ? { ...x, content: e.target.value } : x
                      ))}
                      rows={5}
                      className="resize-none text-sm"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {post.hashtags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal">{tag}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Edit the post above, then copy and paste into {p.label} — or save to calendar to schedule it.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </div>
  )
}
'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isToday, addMonths, subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, X, Facebook, Instagram, Linkedin, Globe, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  getSocialPosts, createSocialPost, updateSocialPost, deleteSocialPost,
  type SocialPost, type Platform, type PostStatus,
} from '@/lib/actions/social-posts'

const PLATFORM_CONFIG: Record<Platform, { label: string; icon: any; color: string; bg: string }> = {
  facebook:  { label: 'Facebook',  icon: Facebook,  color: 'text-blue-600',  bg: 'bg-blue-100 dark:bg-blue-900/30'  },
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-500',  bg: 'bg-pink-100 dark:bg-pink-900/30'  },
  linkedin:  { label: 'LinkedIn',  icon: Linkedin,  color: 'text-blue-700',  bg: 'bg-sky-100 dark:bg-sky-900/30'    },
  google:    { label: 'Google',    icon: Globe,     color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
}

const STATUS_COLORS: Record<PostStatus, string> = {
  draft:     'bg-muted text-muted-foreground',
  scheduled: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  posted:    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface ContentCalendarProps {
  pendingPost?: { platform: Platform; content: string; hashtags: string[] } | null
  onPendingPostConsumed?: () => void
}

export function ContentCalendar({ pendingPost, onPendingPostConsumed }: ContentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null)
  const [detailDate, setDetailDate] = useState<string | null>(null)

  // Form
  const [platform, setPlatform] = useState<Platform>('facebook')
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [status, setStatus] = useState<PostStatus>('draft')
  const [scheduledTime, setScheduledTime] = useState('09:00')

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getSocialPosts()
    setPosts(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // When Social tab sends a post to calendar
  useEffect(() => {
    if (!pendingPost) return
    const today = format(new Date(), 'yyyy-MM-dd')
    setPlatform(pendingPost.platform)
    setContent(pendingPost.content)
    setHashtags(pendingPost.hashtags)
    setStatus('scheduled')
    setScheduledTime('09:00')
    setEditingPost(null)
    setSelectedDate(today)
    setDialogOpen(true)
    onPendingPostConsumed?.()
  }, [pendingPost])

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startPad = (startOfMonth(currentMonth).getDay() + 6) % 7

  const openNew = (date: string) => {
    setEditingPost(null); setSelectedDate(date)
    setPlatform('facebook'); setContent(''); setHashtags([])
    setStatus('draft'); setScheduledTime('09:00')
    setDialogOpen(true)
  }

  const openEdit = (post: SocialPost) => {
    setEditingPost(post); setSelectedDate(post.scheduledDate)
    setPlatform(post.platform); setContent(post.content); setHashtags(post.hashtags)
    setStatus(post.status); setScheduledTime(post.scheduledTime ?? '09:00')
    setDetailDate(null); setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!content.trim()) { toast.error('Add some content first.'); return }
    if (!selectedDate) return
    setSaving(true)
    try {
      if (editingPost) {
        const result = await updateSocialPost(editingPost.id, {
          platform, content, hashtags, status,
          scheduledDate: selectedDate,
          scheduledTime: status === 'scheduled' ? scheduledTime : null,
        })
        if (result.error) { toast.error(result.error); return }
        toast.success('Post updated.')
      } else {
        const result = await createSocialPost({
          platform, content, hashtags, status,
          scheduledDate: selectedDate,
          scheduledTime: status === 'scheduled' ? scheduledTime : undefined,
        })
        if (result.error) { toast.error(result.error); return }
        toast.success('Post added to calendar.')
      }
      await load()
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteSocialPost(id)
    await load()
    setDetailDate(null)
    toast.success('Post removed.')
  }

  const postsForDate = (d: string) => posts.filter(p => p.scheduledDate === d)
  const detailPosts = detailDate ? postsForDate(detailDate) : []

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total posts', value: posts.length },
          { label: 'Posted', value: posts.filter(p => p.status === 'posted').length },
          { label: 'Scheduled', value: posts.filter(p => p.status === 'scheduled').length },
          { label: 'Drafts', value: posts.filter(p => p.status === 'draft').length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">{loading ? '—' : value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Calendar */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`pad-${i}`} className="bg-background min-h-[80px]" />
              ))}
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const dayPosts = postsForDate(dateStr)
                const selected = detailDate === dateStr
                return (
                  <div
                    key={dateStr}
                    className={`bg-background min-h-[80px] p-1 cursor-pointer hover:bg-muted/40 transition-colors group ${selected ? 'ring-2 ring-inset ring-primary' : ''}`}
                    onClick={() => setDetailDate(selected ? null : dateStr)}
                  >
                    <div className={`text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayPosts.slice(0, 2).map(post => {
                        const cfg = PLATFORM_CONFIG[post.platform]
                        const Icon = cfg.icon
                        return (
                          <div key={post.id} className={`flex items-center gap-1 rounded px-1 py-0.5 ${cfg.bg}`}>
                            <Icon className={`size-2.5 shrink-0 ${cfg.color}`} />
                            <span className="truncate text-[10px]">{post.content.slice(0, 14)}</span>
                          </div>
                        )
                      })}
                      {dayPosts.length > 2 && (
                        <div className="text-[10px] text-muted-foreground px-1">+{dayPosts.length - 2} more</div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="mt-0.5 opacity-0 group-hover:opacity-100 text-[10px] text-primary flex items-center gap-0.5 transition-opacity"
                      onClick={e => { e.stopPropagation(); openNew(dateStr) }}
                    >
                      <Plus className="size-2.5" /> Add
                    </button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Day detail panel */}
        {detailDate && (
          <Card className="w-full lg:w-72 shrink-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {format(new Date(detailDate + 'T12:00:00'), 'EEEE, MMM d')}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDetailDate(null)}>
                  <X className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {detailPosts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No posts planned.</p>
              ) : detailPosts.map(post => {
                const cfg = PLATFORM_CONFIG[post.platform]
                const Icon = cfg.icon
                return (
                  <div key={post.id} className="rounded-lg border p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`size-3.5 ${cfg.color}`} />
                        <span className="text-xs font-medium">{cfg.label}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[post.status]}`}>
                        {post.status}
                      </span>
                    </div>
                    {post.scheduledTime && (
                      <p className="text-[10px] text-muted-foreground">⏰ {post.scheduledTime}</p>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-3">{post.content}</p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-6 text-xs px-2 flex-1" onClick={() => openEdit(post)}>Edit</Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-destructive" onClick={() => handleDelete(post.id)}>Delete</Button>
                    </div>
                  </div>
                )
              })}
              <Button size="sm" variant="outline" className="w-full h-7 text-xs mt-1" onClick={() => openNew(detailDate)}>
                <Plus className="size-3 mr-1" /> Add post
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit post' : 'Add post'}</DialogTitle>
            <DialogDescription>
              {selectedDate ? format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy') : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={v => setPlatform(v as Platform)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_CONFIG).map(([id, cfg]) => {
                      const Icon = cfg.icon
                      return (
                        <SelectItem key={id} value={id}>
                          <span className="flex items-center gap-2">
                            <Icon className={`size-3.5 ${cfg.color}`} />
                            {cfg.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={v => setStatus(v as PostStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time picker — only when scheduled */}
            {status === 'scheduled' && (
              <div className="space-y-2">
                <Label>Scheduled time</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste your post content here..."
                rows={5}
                className="resize-none text-sm"
              />
            </div>

            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map(tag => (
                  <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="size-4 mr-2 animate-spin" />Saving...</> : editingPost ? 'Save changes' : 'Add post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
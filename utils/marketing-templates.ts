import type { AudienceType } from '@/types/marketing-types'

export interface SeasonalTemplate {
  id: string
  name: string
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Storm' | 'Year-round'
  emoji: string
  description: string
  subject: string
  body: string
  audienceType: AudienceType
}

export const SEASONAL_TEMPLATES: SeasonalTemplate[] = [
  {
    id: 'spring-cleanup',
    name: 'Spring cleanup',
    season: 'Spring',
    emoji: '🌱',
    description: 'Re-engage past clients with a spring lawn cleanup offer.',
    audienceType: 'past_customers',
    subject: 'Your lawn is ready for spring — let\'s get it looking great',
    body: `Hi {{contact_name}},

Spring is here and your lawn is waking up after winter. Now is the perfect time to get ahead of the season with a professional cleanup.

We're offering spring cleanup packages this month — including leaf removal, edge trimming, and a full tidy-up to get your garden looking its best.

Reply to this email or give us a call to book your slot. Spaces fill up fast this time of year!

Looking forward to working with you again.

Warm regards,
The Team`,
  },
  {
    id: 'summer-maintenance',
    name: 'Summer maintenance',
    season: 'Summer',
    emoji: '☀️',
    description: 'Promote regular summer lawn care to active customers.',
    audienceType: 'active_customers',
    subject: 'Keep your lawn lush this summer',
    body: `Hi {{contact_name}},

Summer heat can be tough on lawns — but with the right care, yours can stay green and healthy all season.

We're now scheduling summer maintenance visits, including mowing, watering advice, and weed control. Regular upkeep through the warmer months makes a huge difference to how your lawn looks come autumn.

Get in touch to add a summer maintenance plan to your service — we'd love to help keep things looking great.

Best,
The Team`,
  },
  {
    id: 'autumn-leaves',
    name: 'Autumn leaf clearance',
    season: 'Autumn',
    emoji: '🍂',
    description: 'Offer leaf clearance services as leaves start to fall.',
    audienceType: 'all_customers',
    subject: 'Autumn is here — time for a leaf clearance',
    body: `Hi {{contact_name}},

The leaves are starting to fall and before long they'll be covering your lawn and borders. Left too long, leaf build-up can damage grass and block light to your plants.

Our autumn leaf clearance service will have everything looking neat and tidy in no time — and we'll make sure your garden is ready to go into winter in great shape.

Book early to get your preferred slot. Reply to this email to arrange a visit.

Thanks,
The Team`,
  },
  {
    id: 'winter-prep',
    name: 'Winter garden prep',
    season: 'Winter',
    emoji: '❄️',
    description: 'Help clients protect their garden before winter sets in.',
    audienceType: 'all_customers',
    subject: 'Protect your garden this winter',
    body: `Hi {{contact_name}},

Winter is just around the corner and now is the best time to prepare your garden before the cold sets in.

Our winter preparation service covers pruning, protecting vulnerable plants, tidying borders, and making sure your lawn goes into the cold season in the best possible condition.

A little care now means a much faster recovery in spring. Get in touch to book your winter prep visit before slots fill up.

Stay warm,
The Team`,
  },
  {
    id: 'storm-response',
    name: 'Storm clearance',
    season: 'Storm',
    emoji: '⛈️',
    description: 'Rapid response offer after storm or weather damage.',
    audienceType: 'all_customers',
    subject: 'Storm damage? We can help',
    body: `Hi {{contact_name}},

After recent storms in the area, many gardens have taken a hit — fallen branches, debris, and damaged plants can pile up fast.

We're offering priority storm clearance visits this week to help get things back to normal quickly. Whether it's a small tidy-up or a bigger clearance job, our team is on hand and ready to help.

Reply to this email to book a visit. We'll get to you as soon as possible.

Thanks,
The Team`,
  },
  {
    id: 're-engage-lost',
    name: 'Win back past clients',
    season: 'Year-round',
    emoji: '🤝',
    description: 'Re-engage customers who haven\'t booked in a while.',
    audienceType: 'past_customers',
    subject: 'We\'d love to work with you again',
    body: `Hi {{contact_name}},

It's been a while since we last worked together and we just wanted to reach out.

Whether your garden needs a one-off tidy or you're looking for regular maintenance, we'd love to help. We've been busy adding new services and would be happy to chat about what might work best for you this season.

If you'd like to book or just have a chat, reply to this email or give us a call.

Hope to hear from you soon,
The Team`,
  },
  {
    id: 'referral-ask',
    name: 'Referral request',
    season: 'Year-round',
    emoji: '⭐',
    description: 'Ask happy active customers to refer friends and family.',
    audienceType: 'active_customers',
    subject: 'Know someone who\'d love a great garden?',
    body: `Hi {{contact_name}},

Thank you so much for being a valued client — it really means a lot to us.

If you know anyone who could use a reliable landscaping team, we'd love an introduction. Word of mouth is how we grow, and we always make sure referrals are looked after.

Just reply to this email with their details or pass on our contact, and we'll take it from there.

Thanks again for your continued support,
The Team`,
  },
  {
    id: 'prospect-intro',
    name: 'Prospect introduction',
    season: 'Year-round',
    emoji: '📬',
    description: 'First-touch outreach to new prospects.',
    audienceType: 'all_prospects',
    subject: 'Professional landscaping services for your business',
    body: `Hi {{contact_name}},

I'm reaching out to introduce our landscaping services. We work with businesses and homeowners across the area, providing reliable maintenance, seasonal cleanups, and bespoke garden projects.

We'd love the chance to discuss how we can help keep your outdoor spaces looking their best — whether that's a one-off job or ongoing care.

If you're open to a quick chat or would like a free quote, just reply to this email.

Looking forward to hearing from you,
The Team`,
  },
]
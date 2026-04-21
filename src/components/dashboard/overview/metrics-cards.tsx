import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconCalendarEvent,
  IconCloudStorm,
  IconCurrencyDollar,
  IconReceipt,
  IconWind,
} from "@tabler/icons-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function MetricsCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid-cols-2 lg:grid-cols-4">
      <Card className="@container/card h-full flex flex-col relative cursor-pointer transition-shadow hover:shadow-md">
        <Link
          href="/dashboard/schedule"
          aria-label="Open schedule"
          className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        <CardHeader className="flex-1">
          <CardDescription>Jobs Today</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            7 Scheduled
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800">
              <IconCloudStorm className="mr-1 size-3" />
              2 At Risk
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            Weather alert in effect
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card h-full flex flex-col relative cursor-pointer transition-shadow hover:shadow-md">
        <Link
          href="/dashboard/projects"
          aria-label="Open projects"
          className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        <CardHeader className="flex-1">
          <CardDescription>Active Projects</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            14 Active
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconBuildingSkyscraper className="mr-1 size-3" />
              Total: 23
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            3 Pending Approval | 6 Completed
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card h-full flex flex-col relative cursor-pointer transition-shadow hover:shadow-md">
        <Link
          href="/dashboard/invoices"
          aria-label="Open invoices"
          className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        <CardHeader className="flex-1">
          <CardDescription>Unpaid Invoices</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $12,750
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800">
              <IconReceipt className="mr-1 size-3" />
              8 Overdue
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            Outstanding balance
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card h-full flex flex-col relative cursor-pointer transition-shadow hover:shadow-md">
        <Link
          href="/dashboard/schedule/weather"
          aria-label="Open weather dashboard"
          className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        <CardHeader className="flex-1">
          <CardDescription>Weather Status</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            Severe Wind
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800">
              <IconWind className="mr-1 size-3" />
              Warning
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            2 Locations affected today
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


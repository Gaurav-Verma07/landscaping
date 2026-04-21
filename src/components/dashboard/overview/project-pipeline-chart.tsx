"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Project Pipeline Chart"

const chartData = [
  { date: "2024-04-01", leads: 45, estimates: 30, won: 12, completed: 8 },
  { date: "2024-04-08", leads: 52, estimates: 35, won: 15, completed: 10 },
  { date: "2024-04-15", leads: 48, estimates: 32, won: 14, completed: 12 },
  { date: "2024-04-22", leads: 60, estimates: 40, won: 18, completed: 15 },
  { date: "2024-04-29", leads: 55, estimates: 38, won: 16, completed: 14 },
  { date: "2024-05-06", leads: 65, estimates: 45, won: 20, completed: 18 },
  { date: "2024-05-13", leads: 70, estimates: 50, won: 22, completed: 20 },
  { date: "2024-05-20", leads: 62, estimates: 42, won: 19, completed: 17 },
  { date: "2024-05-27", leads: 75, estimates: 55, won: 25, completed: 22 },
  { date: "2024-06-03", leads: 80, estimates: 60, won: 28, completed: 25 },
  { date: "2024-06-10", leads: 72, estimates: 52, won: 24, completed: 21 },
  { date: "2024-06-17", leads: 85, estimates: 65, won: 30, completed: 28 },
  { date: "2024-06-24", leads: 90, estimates: 70, won: 35, completed: 30 },
]

const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(var(--chart-1))",
  },
  estimates: {
    label: "Estimates",
    color: "hsl(var(--chart-2))",
  },
  won: {
    label: "Jobs Won",
    color: "hsl(var(--chart-3))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function ProjectPipelineChart() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  return (
    <Card className="@container/card h-full">
      <CardHeader>
        <CardTitle>Project Pipeline</CardTitle>
        <CardDescription>
          Performance over the last 90 days
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-leads)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-leads)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillEstimates" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-estimates)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-estimates)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillWon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-won)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-won)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-completed)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-completed)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="leads"
              type="natural"
              fill="url(#fillLeads)"
              stroke="var(--color-leads)"
              stackId="1"
            />
            <Area
              dataKey="estimates"
              type="natural"
              fill="url(#fillEstimates)"
              stroke="var(--color-estimates)"
              stackId="1"
            />
            <Area
              dataKey="won"
              type="natural"
              fill="url(#fillWon)"
              stroke="var(--color-won)"
              stackId="1"
            />
            <Area
              dataKey="completed"
              type="natural"
              fill="url(#fillCompleted)"
              stroke="var(--color-completed)"
              stackId="1"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}


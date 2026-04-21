import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, UserPlus, CloudLightning, Image as ImageIcon, Hammer } from "lucide-react"

const activities = [
  {
    icon: ImageIcon,
    text: "Uploaded 4 photos to Project #1010",
    time: "2 hours ago",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: FileText,
    text: "Invoice #5678 was sent to Mark Johnson",
    time: "5 hours ago",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Hammer,
    text: "Crew 2 was assigned to Project #1009",
    time: "Yesterday",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: FileText,
    text: "Estimate #2430 was created for John Smith",
    time: "Yesterday",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: UserPlus,
    text: "New Client 'Susan Davis' added",
    time: "2 days ago",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    icon: CloudLightning,
    text: "Weather Alert: Hail Warning in Sector 4",
    time: "3 days ago",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
]

export function ActivityFeed() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Activity Stream</CardTitle>
        <CardDescription>Recent updates across your company</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-6">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className={`rounded-full p-2 ${activity.bg} ${activity.color}`}>
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.text}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction } from "lucide-react"

export function ComingSoon({ title }: { title?: string }) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-full items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center border-dashed">
        <CardHeader>
          <div className="mx-auto p-4 bg-muted rounded-full mb-4">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            We&apos;re hard at work building {title ? `the ${title}` : "this"} feature. 
            Check back soon for updates!
          </p>

        </CardContent>
      </Card>
    </div>
  )
}

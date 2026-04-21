import Link from "next/link"
import { Calculator, FileText, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function EstimatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estimates</h1>
        <p className="text-muted-foreground">
          Generate quick quotes, build detailed proposals, and standardize pricing with templates.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Quick Quote
            </CardTitle>
            <CardDescription>
              Fast ballpark pricing based on sqft, difficulty, waste, and margin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/estimates/quick">Create quick quote</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Full Estimate
            </CardTitle>
            <CardDescription>
              A more complete estimate workflow. Start from a quick quote, then refine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/estimates/full">Open full estimate</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Templates
            </CardTitle>
            <CardDescription>
              Save reusable scope + line items so quoting stays consistent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/estimates/templates">Manage templates</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


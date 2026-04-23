import { ComingSoon } from "@/components/dashboard/ui/coming-soon"

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params

  const title = slug
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" - ")
    .replace(/-/g, " ")

  return <ComingSoon title={title} />
}

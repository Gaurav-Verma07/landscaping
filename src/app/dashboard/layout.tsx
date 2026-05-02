import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import StoreInitializer from "@/components/store-initializer"
import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header"
import { VoiceAssistantProvider } from "@/components/dashboard/layout/voice-assistant/voice-assistant-provider"
import { VoiceAssistantDock } from "@/components/dashboard/layout/voice-assistant/voice-assistant-dock"
import { QueryProvider } from "@/components/query-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <QueryProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <StoreInitializer user={user} />
        <AppSidebar user={user} />
        <SidebarInset>
          <VoiceAssistantProvider>
            <DashboardHeader />
            <div className="flex flex-1 flex-col p-4 pt-0">{children}</div>
            <VoiceAssistantDock />
          </VoiceAssistantProvider>
        </SidebarInset>
      </SidebarProvider>
    </QueryProvider>
  )
}
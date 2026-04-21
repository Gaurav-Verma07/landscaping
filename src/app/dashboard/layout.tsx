import { cookies } from "next/headers"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import { CustomerStoreWrapper } from "@/components/dashboard/layout/customer-store-wrapper"
import StoreInitializer from "@/components/store-initializer"
import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header"
import { VoiceAssistantProvider } from "@/components/dashboard/layout/voice-assistant/voice-assistant-provider"
import { VoiceAssistantDock } from "@/components/dashboard/layout/voice-assistant/voice-assistant-dock"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = null

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <StoreInitializer user={user} />
      <AppSidebar user={user} />
      <SidebarInset>
        <CustomerStoreWrapper>
          <VoiceAssistantProvider>
            <DashboardHeader />
            <div className="flex flex-1 flex-col p-4 pt-0">{children}</div>
            <VoiceAssistantDock />
          </VoiceAssistantProvider>
        </CustomerStoreWrapper>
      </SidebarInset>
    </SidebarProvider>
  )
}

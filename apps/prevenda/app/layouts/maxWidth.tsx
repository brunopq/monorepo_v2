import { Outlet } from "react-router"

import { Sidebar, SidebarProvider } from "~/components/ui/sidebar"

export default function MaxWidth() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen px-4">
        <Sidebar />

        <div className="mx-auto mt-6 mb-32 w-full">
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  )
}

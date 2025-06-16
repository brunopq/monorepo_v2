import { Outlet } from "react-router"

export default function MaxWidth() {
  return (
    <div className="mx-auto mt-6 mb-32 w-[min(80rem,100%-2rem)]">
      <Outlet />
    </div>
  )
}

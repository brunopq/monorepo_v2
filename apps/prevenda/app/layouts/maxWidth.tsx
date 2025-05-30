import { Outlet } from "react-router"

export default function MaxWidth() {
  return (
    <div className="mx-auto mt-6 mb-32 w-[min(calc(100%-2rem),64rem)]">
      <Outlet />
    </div>
  )
}

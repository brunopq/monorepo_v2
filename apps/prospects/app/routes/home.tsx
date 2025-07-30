import type { Route } from "./+types/home"

import { getUserOrRedirect } from "~/utils/authGuard"

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ]
}

export async function loader({ request }: Route.LoaderArgs) {
  return await getUserOrRedirect(request, "/login")
}

export default function Home() {
  return (
    <div>
      <h1 className="font-semibold text-2xl">Hello, world</h1>
    </div>
  )
}

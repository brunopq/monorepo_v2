import type { Route } from "./+types/home"

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ]
}

export function loader({ request }: Route.LoaderArgs) {}

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      <header className="border-primary-700 border-b border-dotted">
        <h1 className="font-semibold text-primary-700 text-xl">
          Painel de admin
        </h1>
      </header>

      <h2 className="font-semibold text-2xl text-primary-800">Usuários:</h2>
    </div>
  )
}

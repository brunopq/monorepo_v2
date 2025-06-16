import { NavLink } from "react-router"

export default function BasicNav() {
  return (
    <nav className="-mt-4 mb-6 flex gap-4 border-y border-dotted py-1 text-sm *:transition-colors dark:border-zinc-700 dark:text-zinc-400 *:hover:dark:text-primary-200">
      <NavLink
        className={({ isActive }) => (isActive ? "dark:text-primary-100" : "")}
        to="/"
      >
        home
      </NavLink>
      <NavLink
        className={({ isActive }) => (isActive ? "dark:text-primary-100" : "")}
        to="/templates"
      >
        templates
      </NavLink>
      <NavLink
        className={({ isActive }) => (isActive ? "dark:text-primary-100" : "")}
        to="/fichas"
      >
        fichas
      </NavLink>
    </nav>
  )
}

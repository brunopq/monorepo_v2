import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes"

export default [
  route("login", "routes/login.tsx"),
  layout("layouts/maxWidth.tsx", [
    index("routes/home.tsx"),
    ...prefix("templates", [
      index("routes/templates.tsx"),
      route("edit/:id", "routes/editTemplate/index.tsx"),
    ]),
    ...prefix("fichas", [
      index("routes/fichas.tsx"),
      route(":id", "routes/submission/index.tsx"),
    ]),
  ]),
] satisfies RouteConfig

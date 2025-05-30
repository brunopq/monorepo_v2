import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes"

export default [
  layout("layouts/maxWidth.tsx", [
    ...prefix("templates", [
      index("routes/templates.tsx"),
      route("edit/:id", "routes/editTemplate/index.tsx"),
    ]),
    ...prefix("fichas", [
      index("routes/fichas.tsx"),
      route("edit/:id", "routes/editSubmission/index.tsx"),
    ]),
  ]),
] satisfies RouteConfig

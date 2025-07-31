import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/index.tsx"),
    route('/app', 'routes/home.tsx'),
    route('/login', 'routes/login.tsx'),
    route('/listas/novo', 'routes/lists/new.tsx'),
] satisfies RouteConfig;

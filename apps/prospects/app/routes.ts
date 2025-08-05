import { type RouteConfig, index, route, prefix, } from "@react-router/dev/routes";

export default [
    index("routes/index.tsx"),
    route('/app', 'routes/home.tsx'),
    route('/login', 'routes/login.tsx'),
    ...prefix('/listas', [
        route('/novo', 'routes/lists/new.tsx'),
        route('/:id', 'routes/lists/[id].tsx'),
    ])
] satisfies RouteConfig;

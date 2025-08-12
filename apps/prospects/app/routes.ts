import { type RouteConfig, index, route, prefix, } from "@react-router/dev/routes";

export default [
    index("routes/index.tsx"),
    route('/app', 'routes/home.tsx'),
    route('/login', 'routes/login.tsx'),
    route('/logout', 'routes/logout.tsx'),
    ...prefix('/users', [
        route('/', 'routes/users/index.tsx'),
    ]),
    ...prefix('/listas', [
        route('/novo', 'routes/lists/new/index.tsx'),
        route('/:id', 'routes/lists/[id].tsx'),
    ]),
    ...prefix('/listinhas', [
        route('/:id', 'routes/subLists/[id].tsx'),
    ]),
    ...prefix('/leads', [
        ...prefix('/:id', [
            ...prefix('/interactions', [
                index('routes/leads/[id]/interactions/index.tsx'),
                route('/:id', 'routes/leads/[id]/interactions/[id].tsx'),
            ]),
        ])
    ]),
] satisfies RouteConfig;

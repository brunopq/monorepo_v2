import { serve } from "bun"
import { renderToString } from "react-dom/server.bun"

import preview from "./preview.html"

import { Button, Select } from "./index"

serve({
  port: 8491,
  development: true,
  routes: {
    "/preview": preview,
  },
})

import { build, $ } from "bun"

await build({
    entrypoints: ["src/index.ts"],
    outdir: "dist",
    target: "bun"
})

await $`cp -r --parents ./drizzle ./dist`

console.log("Build completed for auauth")
import { mkdir, opendir } from 'node:fs/promises'
import { $, file } from 'bun'


async function subfolders(path: string) {
    return (await $`ls ./${path}`.text()).split('\n').filter(Boolean)
}


async function dirExists(path: string) {
    try {
        await (await opendir(path)).read()
        return true
    } catch {
        return false
    }
}

/**
 * @returns a list of the successfully built packages
 */
async function buildPackages(path: string): Promise<string[]> {
    const packages = await subfolders(path)
    const built: string[] = []

    for (const pkg of packages) {
        const packageJson = file(`./${path}/${pkg}/package.json`)

        if (!await packageJson.exists()) {
            console.error(`Package ${pkg} does not have a package.json file.`)
            continue
        }

        const packageData = await packageJson.json()
        const pkgName = packageData.name

        const buildScript = packageData.scripts?.build

        if (!buildScript) {
            console.error(`Package ${pkg} does not have a build script defined in package.json.`)
            continue
        }

        console.log(`Building package ${pkgName} - (${packageData.version})`)

        try {
            await $`bun --bun run --filter ${pkgName} build`.quiet()
            console.log(`Package ${pkgName} built successfully.`)
            built.push(pkgName)
        } catch (error) {
            console.error(`Failed to build package ${pkgName}`)
        }
    }

    return built
}

await buildPackages('packages')
console.log('Packages built successfully.')
const apps = await buildPackages('apps')

for (const app of apps) {
    if (!await dirExists(`./apps/${app}/dist`)) {
        console.error(`App ${app} does not have a dist directory. Ensure it is built correctly.`)
        continue
    }

    await mkdir(`./dist/${app}`, { recursive: true })
    await $`cp -r ./apps/${app}/dist/* ./dist/${app}`
    console.log(`App ${app} copied to dist successfully.`)
}
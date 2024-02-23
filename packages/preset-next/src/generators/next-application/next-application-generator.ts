import { addDependenciesToPackageJson, getProjects, installPackagesTask, Tree } from '@nx/devkit'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import { anchorApplicationGenerator } from '@solana-developers/preset-anchor'
import { applicationCleanup, packageVersion } from '@solana-developers/preset-common'
import {
  applicationTailwindConfig,
  features,
  generateReactCommonFiles,
  reactApplicationDependencies,
  ReactFeature,
  reactFeatureGenerator,
  reactTemplateGenerator,
  walletAdapterDependencies,
} from '@solana-developers/preset-react'
import { join } from 'path'
import { generateNextApplication, NormalizedNextApplicationSchema, normalizeNextApplicationSchema } from '../../utils'
import nextTemplateGenerator from '../next-template/next-template-generator'
import { NextApplicationSchema } from './next-application-schema'

export async function nextApplicationGenerator(tree: Tree, rawOptions: NextApplicationSchema) {
  const options: NormalizedNextApplicationSchema = normalizeNextApplicationSchema(rawOptions)
  const project = await generateNextApplication(tree, options)
  const npmScope = getNpmScope(tree)

  // Clean up the default project files.
  const cleanup = [
    '/app/global.css',
    '/app/page.module.css',
    '/app/layout.tsx',
    '/app/page.tsx',
    '/public/favicon.ico',
    '/public/.gitkeep',
  ]
  applicationCleanup(tree, join(project.sourceRoot, 'app'), cleanup)

  // Generate the base files from the templates.
  await nextTemplateGenerator(tree, {
    name: options.webName,
    npmScope,
    template: 'base',
    anchor: options.anchor,
    anchorName: options.anchorName,
    webName: options.webName,
    directory: project.sourceRoot,
  })

  // Generate the component files from the React template.
  const components = join(project.sourceRoot, 'components')
  await reactTemplateGenerator(
    tree,
    {
      name: options.webName,
      npmScope,
      template: options.ui,
      anchor: options.anchor,
      anchorName: options.anchorName,
      webName: options.webName,
      directory: components,
      preset: 'next',
    },
    'src/app/',
  )
  // Delete react app and routes.
  tree.delete(`${components}/app.tsx`)
  tree.delete(`${components}/app-routes.tsx`)

  // Generate the ui files from the templates.
  await nextTemplateGenerator(tree, {
    name: options.webName,
    npmScope,
    template: options.ui,
    anchor: options.anchor,
    anchorName: options.anchorName,
    webName: options.webName,
    directory: project.sourceRoot,
  })

  // Generate the solana-provider from the templates.
  await reactTemplateGenerator(tree, {
    name: options.webName,
    npmScope,
    template: 'solana-provider',
    anchor: options.anchor,
    anchorName: options.anchorName,
    webName: options.webName,
    directory: join(components, 'solana'),
    preset: 'next',
  })

  // Add the dependencies for the base application.
  reactApplicationDependencies(tree, options)

  addDependenciesToPackageJson(
    tree,
    {
      '@tanstack/react-query-next-experimental': packageVersion['@tanstack']['react-query-next-experimental'],
      encoding: packageVersion.encoding,
    },
    {},
  )

  // Add the dependencies for the wallet adapter.
  walletAdapterDependencies(tree)

  if (options.ui === 'tailwind') {
    // Add the tailwind config.
    await applicationTailwindConfig(tree, options.webName)
  }

  if (options.anchor !== 'none' && !getProjects(tree).has(options.anchorName)) {
    const feature: ReactFeature = features.find((feature) => feature.toString() === `anchor-${options.anchor}`)

    if (!feature) {
      throw new Error(`Invalid anchor feature: ${options.anchor}`)
    }

    await anchorApplicationGenerator(tree, {
      name: options.anchorName,
      skipFormat: true,
    })

    await reactFeatureGenerator(tree, {
      name: feature.replace('anchor-', '').toString(),
      anchorName: options.anchorName,
      webName: options.webName,
      skipFormat: true,
      feature,
    })

    if (options.anchor === 'counter' && options.ui !== 'none') {
      tree.write(
        join(project.sourceRoot, 'app/counter/page.tsx'),
        `import CounterFeature from '@/components/counter/counter-feature';

export default function Page() {
  return <CounterFeature />;
}
`,
      )
    }
  }
  // Patch node-gyp-build error
  const nextConfigPath = join(project.root, 'next.config.js')
  const nextConfig = tree.read(nextConfigPath, 'utf-8')
  const needle = 'const nextConfig = {'
  const snippet = `webpack: (config) => {
    config.externals = [ ...(config.externals || []), 'bigint', 'node-gyp-build'];
    return config;
  },`
  tree.write(nextConfigPath, nextConfig.replace(needle, `${needle}\n${snippet}`))

  await generateReactCommonFiles(tree, options, npmScope)

  // Install the packages on exit.
  return () => {
    installPackagesTask(tree, true)
  }
}

export default nextApplicationGenerator

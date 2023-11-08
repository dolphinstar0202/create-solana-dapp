import { readProjectConfiguration, Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { getRecursiveFileContents } from '@solana-developers/preset-common'
import {
  ApplicationAnchorTemplate,
  normalizeApplicationAnchorSchema,
  NormalizedApplicationAnchorSchema,
} from '../../utils'
import { applicationAnchorGenerator } from './application-anchor-generator'
import { ApplicationAnchorSchema } from './application-anchor-schema'

describe('application generator', () => {
  let tree: Tree
  const rawOptions: ApplicationAnchorSchema = { name: 'anchor-app' }
  const options: NormalizedApplicationAnchorSchema = normalizeApplicationAnchorSchema(rawOptions)

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('should run successfully', async () => {
    await applicationAnchorGenerator(tree, options)
    const config = readProjectConfiguration(tree, options.name)
    expect(config).toBeDefined()
  })

  it.each([['counter'], ['hello-world']])('should generate app with "%s" template', async (template) => {
    await applicationAnchorGenerator(tree, { ...options, template: template as ApplicationAnchorTemplate })

    const config = readProjectConfiguration(tree, options.name)
    const contents = getRecursiveFileContents(tree, config.root)
    expect(contents).toMatchSnapshot()

    const rootTsConfig = tree.read('tsconfig.base.json').toString()
    expect(rootTsConfig).toMatchSnapshot()
  })
})

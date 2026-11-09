import * as pulumi from '@pulumi/pulumi'
import { afterAll, beforeAll, expect, test, vi } from 'vite-plus/test'

const resources: pulumi.runtime.MockResourceArgs[] = []
const options: pulumi.CustomResourceOptions[] = []

beforeAll(async () => {
  vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'test-account')
  await pulumi.runtime.setMocks(
    {
      call: (args) => {
        throw new Error(`Unexpected provider invocation: ${args.token}`)
      },
      newResource: (args) => {
        if (args.type !== 'pulumi:pulumi:Stack') resources.push(args)
        // oxlint-disable-next-line typescript/no-unsafe-assignment -- Pulumi mock inputs must be echoed as resource state.
        return { id: args.id, state: args.inputs }
      },
    },
    'cloudflare',
    'production',
  )
  await pulumi.runtime.runInPulumiStack(async () => {
    pulumi.runtime.registerStackTransformation((args) => {
      if (args.type === 'cloudflare:index/webAnalyticsSite:WebAnalyticsSite') {
        options.push(args.opts)
      }
      return undefined
    })
    const { zoneWebAnalytics } = await import('./web-analytics.ts')
    await new Promise<void>((resolve) => zoneWebAnalytics.urn.apply(() => resolve()))
    return {}
  })
})

afterAll(() => vi.unstubAllEnvs())

test('imports only the zone site and preserves its auto-install policy without recreating rules', () => {
  expect(resources).toEqual([
    expect.objectContaining({
      custom: true,
      id: 'test-account/6b545023d8aa47f5864bf3b57e07b782',
      name: 'iac-prod-zone-web-analytics',
      type: 'cloudflare:index/webAnalyticsSite:WebAnalyticsSite',
      inputs: {
        accountId: 'test-account',
        autoInstall: true,
        enabled: true,
        lite: false,
        zoneTag: '502c8e36ae3b0e13da67e015e67c6b35',
      },
    }),
  ])
  expect(options).toEqual([
    expect.objectContaining({ import: 'test-account/6b545023d8aa47f5864bf3b57e07b782', protect: true }),
  ])
})

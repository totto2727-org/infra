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
      if (args.type === 'cloudflare:index/zeroTrustGatewayLogging:ZeroTrustGatewayLogging') {
        options.push(args.opts)
      }
      return undefined
    })
    const { gatewayLogging } = await import('./zero-trust.ts')
    await new Promise<void>((resolve) => gatewayLogging.urn.apply(() => resolve()))
    return {}
  })
})

afterAll(() => vi.unstubAllEnvs())

test('imports only the existing Gateway logging policy without changing its privacy settings', () => {
  expect(resources).toEqual([
    expect.objectContaining({
      custom: true,
      id: 'test-account',
      name: 'iac-prod-gateway-logging',
      type: 'cloudflare:index/zeroTrustGatewayLogging:ZeroTrustGatewayLogging',
      inputs: {
        accountId: 'test-account',
        redactPii: false,
        settingsByRuleType: {
          dns: { logAll: true, logBlocks: false },
          http: { logAll: true, logBlocks: false },
          l4: { logAll: true, logBlocks: false },
        },
      },
    }),
  ])
  expect(options).toEqual([expect.objectContaining({ import: 'test-account', protect: true })])
})

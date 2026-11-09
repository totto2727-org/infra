import * as pulumi from '@pulumi/pulumi'
import { getMonitor } from '@pulumi/pulumi/runtime/settings.js'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vite-plus/test'

const resources: pulumi.runtime.MockResourceArgs[] = []
const imports: { name: string; id: string; protect: boolean }[] = []

beforeAll(async () => {
  vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'test-account')
  await pulumi.runtime.setMocks(
    {
      call: (args) => {
        throw new Error(`Unexpected provider invocation: ${args.token}`)
      },
      newResource: (args) => {
        resources.push(args)
        // oxlint-disable-next-line typescript/no-unsafe-assignment -- Pulumi mock inputs are provider-owned state.
        return { id: args.name, state: args.inputs }
      },
    },
    'cloudflare',
    'production',
  )
  const monitor = getMonitor()
  if (!monitor) throw new Error('Pulumi mock monitor is required')
  const registration = vi.spyOn(monitor, 'registerResource')
  const { emailRoutingCatchAll } = await import('./email-routing.ts')
  const { promise, resolve } = Promise.withResolvers<void>()
  emailRoutingCatchAll.id.apply(() => resolve())
  await promise
  for (const [request] of registration.mock.calls) {
    imports.push({ name: request.getName(), id: request.getImportid(), protect: request.getProtect() === true })
  }
})

afterAll(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('Email Routing adoption', () => {
  test('imports the existing catch-all using the zone ID, not its rule ID', () => {
    expect(imports).toEqual([
      { name: 'iac-prod-email-routing-catch-all', id: '502c8e36ae3b0e13da67e015e67c6b35', protect: true },
    ])
  })

  test('preserves disabled drop and excludes duplicate rules, DNS management and routing enablement', () => {
    expect(resources.map(({ type, name, inputs }) => ({ type, name, inputs }))).toEqual([
      {
        type: 'cloudflare:index/emailRoutingCatchAll:EmailRoutingCatchAll',
        name: 'iac-prod-email-routing-catch-all',
        inputs: {
          zoneId: '502c8e36ae3b0e13da67e015e67c6b35',
          name: '',
          enabled: false,
          matchers: [{ type: 'all' }],
          actions: [{ type: 'drop' }],
          source: 'api',
        },
      },
    ])
  })
})

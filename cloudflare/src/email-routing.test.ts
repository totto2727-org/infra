import * as pulumi from '@pulumi/pulumi'
import { getMonitor } from '@pulumi/pulumi/runtime/settings.js'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vite-plus/test'

const resources: pulumi.runtime.MockResourceArgs[] = []
const imports: { name: string; id: string; protect: boolean }[] = []
const dependencies = new Map<string, string[]>()

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
  const { emailRoutingApexDns, emailRoutingCatchAll, emailRoutingSettings, emailRoutingSubdomainDns } =
    await import('./email-routing.ts')
  await Promise.all(
    [emailRoutingApexDns, emailRoutingCatchAll, emailRoutingSettings, emailRoutingSubdomainDns].map((resource) => {
      const { promise, resolve } = Promise.withResolvers<void>()
      resource.id.apply(() => resolve())
      return promise
    }),
  )
  for (const [request] of registration.mock.calls) {
    imports.push({ name: request.getName(), id: request.getImportid(), protect: request.getProtect() === true })
    dependencies.set(request.getName(), request.getDependenciesList())
  }
})

afterAll(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('Email Routing adoption', () => {
  test('orders DNS configuration after settings and serializes writes to the same zone', () => {
    expect(dependencies.get('iac-prod-email-routing-apex-dns')).toEqual([
      expect.stringContaining('::iac-prod-email-routing-settings'),
    ])
    expect(dependencies.get('iac-prod-email-routing-subdomain-dns')).toEqual([
      expect.stringContaining('::iac-prod-email-routing-apex-dns'),
    ])
  })

  test('imports settings and catch-all while configuring DNS through protected native Create', () => {
    expect(imports.toSorted((left, right) => left.name.localeCompare(right.name))).toEqual([
      { name: 'iac-prod-email-routing-apex-dns', id: '', protect: true },
      { name: 'iac-prod-email-routing-catch-all', id: '502c8e36ae3b0e13da67e015e67c6b35', protect: true },
      { name: 'iac-prod-email-routing-settings', id: '502c8e36ae3b0e13da67e015e67c6b35', protect: true },
      { name: 'iac-prod-email-routing-subdomain-dns', id: '', protect: true },
    ])
  })

  test('preserves plus-addressing and disabled drop without duplicate DNS owners or rules', () => {
    const expected = [
      {
        type: 'cloudflare:index/emailRoutingSettings:EmailRoutingSettings',
        name: 'iac-prod-email-routing-settings',
        inputs: {
          zoneId: '502c8e36ae3b0e13da67e015e67c6b35',
          supportSubaddress: true,
        },
      },
      {
        type: 'cloudflare:index/emailRoutingDns:EmailRoutingDns',
        name: 'iac-prod-email-routing-apex-dns',
        inputs: {
          zoneId: '502c8e36ae3b0e13da67e015e67c6b35',
          name: 'totto2727.dev',
        },
      },
      {
        type: 'cloudflare:index/emailRoutingDns:EmailRoutingDns',
        name: 'iac-prod-email-routing-subdomain-dns',
        inputs: {
          zoneId: '502c8e36ae3b0e13da67e015e67c6b35',
          name: 'email.totto2727.dev',
          subdomain: 'email.totto2727.dev',
        },
      },
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
    ]
    expect(
      resources
        .map(({ type, name, inputs }) => ({ type, name, inputs }))
        .toSorted((left, right) => left.name.localeCompare(right.name)),
    ).toEqual(expected.toSorted((left, right) => left.name.localeCompare(right.name)))
  })
})

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
  const { sharedDnsRecords } = await import('./dns.ts')
  const { promise, resolve } = Promise.withResolvers<void>()
  pulumi.all(sharedDnsRecords.map((record) => record.id)).apply(() => resolve())
  await promise
  for (const [request] of registration.mock.calls) {
    imports.push({ name: request.getName(), id: request.getImportid(), protect: request.getProtect() === true })
  }
})

afterAll(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('Shared DNS adoption', () => {
  test('imports and protects exactly the three independently manageable TXT records', () => {
    expect(imports).toEqual([
      {
        name: 'iac-prod-dns-dmarc',
        id: '502c8e36ae3b0e13da67e015e67c6b35/ebd045e894a1bad55664cbce5afad9ca',
        protect: true,
      },
      {
        name: 'iac-prod-dns-apex-spf',
        id: '502c8e36ae3b0e13da67e015e67c6b35/6baf9f43d3313f0f599deb948aa62ba6',
        protect: true,
      },
      {
        name: 'iac-prod-dns-email-spf',
        id: '502c8e36ae3b0e13da67e015e67c6b35/1cb69c2d6342fdb1bd566b1e5413fc8c',
        protect: true,
      },
    ])
  })

  test('preserves the exact quoted TXT values and does not register service-owned DNS', () => {
    expect(resources.map(({ type, name, inputs }) => ({ type, name, inputs }))).toEqual([
      {
        type: 'cloudflare:index/dnsRecord:DnsRecord',
        name: 'iac-prod-dns-dmarc',
        inputs: {
          zoneId: '502c8e36ae3b0e13da67e015e67c6b35',
          name: '_dmarc.totto2727.dev',
          type: 'TXT',
          content: '"v=DMARC1; p=none; rua=mailto:360da409adee42c39d6c4a3f54fbdbb6@dmarc-reports.cloudflare.net"',
          ttl: 1,
          proxied: false,
          tags: [],
        },
      },
      ...[
        ['iac-prod-dns-apex-spf', 'totto2727.dev'],
        ['iac-prod-dns-email-spf', 'email.totto2727.dev'],
      ].map(([name, hostname]) => ({
        type: 'cloudflare:index/dnsRecord:DnsRecord',
        name,
        inputs: {
          zoneId: '502c8e36ae3b0e13da67e015e67c6b35',
          name: hostname,
          type: 'TXT',
          content: '"v=spf1 include:_spf.mx.cloudflare.net ~all"',
          ttl: 1,
          proxied: false,
          tags: [],
        },
      })),
    ])
  })
})

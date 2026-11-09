import * as pulumi from '@pulumi/pulumi'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vite-plus/test'

const resources: pulumi.runtime.MockResourceArgs[] = []
const options: pulumi.CustomResourceOptions[] = []
const accountId = '5643a837ef66765e7881c0831a36ebed'
const zoneId = '502c8e36ae3b0e13da67e015e67c6b35'

beforeAll(async () => {
  vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', accountId)
  await pulumi.runtime.setMocks(
    {
      call: (args) => {
        throw new Error(`Unexpected provider invocation: ${args.token}`)
      },
      newResource: (args) => {
        if (args.custom) resources.push(args)
        // oxlint-disable-next-line typescript/no-unsafe-assignment -- Pulumi mock inputs are any and must be echoed as state.
        return { id: args.name, state: args.inputs }
      },
    },
    'cloudflare',
    'production',
  )
  await pulumi.runtime.runInPulumiStack(async () => {
    pulumi.runtime.registerStackTransformation((args) => {
      if (
        [
          'cloudflare:index/accountDnsSettings:AccountDnsSettings',
          'cloudflare:index/zoneDnsSettings:ZoneDnsSettings',
          'cloudflare:index/schemaValidationSettings:SchemaValidationSettings',
        ].includes(args.type)
      ) {
        options.push(args.opts)
      }
      return undefined
    })
    const { accountDnsSettings, zoneDnsSettings, schemaValidationSettings } = await import('./dns-settings.ts')
    return {
      accountDnsSettings: accountDnsSettings.id,
      zoneDnsSettings: zoneDnsSettings.id,
      schemaValidationSettings: schemaValidationSettings.id,
    }
  })
})

afterAll(() => {
  vi.unstubAllEnvs()
})

const expectedDnsSettings = {
  flattenAllCnames: false,
  foundationDns: false,
  multiProvider: false,
  nameservers: { type: 'cloudflare.standard' },
  nsTtl: 86400,
  secondaryOverrides: false,
  soa: {
    expire: 604800,
    minTtl: 1800,
    refresh: 10000,
    retry: 2400,
    rname: 'dns.cloudflare.com',
    ttl: 3600,
  },
  zoneMode: 'standard',
}

describe('Native DNS and schema settings singletons', () => {
  test('registers only the three native settings resources', () => {
    expect(resources).toHaveLength(3)
    expect(resources.map(({ type, name }) => ({ type, name }))).toEqual(
      expect.arrayContaining([
        {
          type: 'cloudflare:index/accountDnsSettings:AccountDnsSettings',
          name: 'iac-prod-account-dns-settings',
        },
        { type: 'cloudflare:index/zoneDnsSettings:ZoneDnsSettings', name: 'iac-prod-zone-dns-settings' },
        {
          type: 'cloudflare:index/schemaValidationSettings:SchemaValidationSettings',
          name: 'iac-prod-schema-validation-settings',
        },
      ]),
    )
  })

  test('preserves exact observed writable account defaults without inventing enforceDnsOnly or null strings', () => {
    expect(resources.find(({ name }) => name === 'iac-prod-account-dns-settings')?.inputs).toEqual({
      accountId,
      zoneDefaults: expectedDnsSettings,
    })
  })

  test('preserves exact observed writable zone settings without assigning a nameserver or fallback zone', () => {
    expect(resources.find(({ name }) => name === 'iac-prod-zone-dns-settings')?.inputs).toEqual({
      zoneId,
      ...expectedDnsSettings,
    })
  })

  test('keeps schema validation disabled without changing the null override to none', () => {
    expect(resources.find(({ name }) => name === 'iac-prod-schema-validation-settings')?.inputs).toEqual({
      zoneId,
      validationDefaultMitigationAction: 'none',
    })
  })

  test('protects singleton wrappers without unsupported import IDs', () => {
    expect(options).toHaveLength(3)
    for (const option of options) {
      expect(option.protect).toBe(true)
      expect(option).not.toHaveProperty('import')
    }
    for (const resource of resources) expect(resource.id).toBe('')
  })
})

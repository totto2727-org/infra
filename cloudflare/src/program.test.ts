import * as pulumi from '@pulumi/pulumi'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vite-plus/test'

const resources: pulumi.runtime.MockResourceArgs[] = []
const options = new Map<string, pulumi.CustomResourceOptions>()
const entrypointNames = new Set<string>()

beforeAll(async () => {
  vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'test-account')
  await pulumi.runtime.setMocks(
    {
      call: (args) => {
        switch (args.token) {
          case 'cloudflare:index/getAccountPermissionGroups:getAccountPermissionGroups':
            return { results: [{ name: 'Super Administrator - All Privileges', id: 'program-permission-group' }] }
          case 'cloudflare:index/getResourceGroups:getResourceGroups':
            return { results: [{ name: 'com.cloudflare.api.account.test-account', id: 'program-resource-group' }] }
          default:
            throw new Error(`Unexpected provider invocation: ${args.token}`)
        }
      },
      newResource: (args) => {
        if (args.type.startsWith('cloudflare:')) resources.push(args)
        // oxlint-disable-next-line typescript/no-unsafe-assignment -- Provider mock state echoes the real program's inputs.
        return { id: args.id ?? args.name, state: args.inputs }
      },
    },
    'cloudflare',
    'production',
  )
  await pulumi.runtime.runInPulumiStack(async () => {
    pulumi.runtime.registerStackTransformation((args) => {
      if (args.type.startsWith('cloudflare:')) options.set(args.name, args.opts)
      return undefined
    })
    await import('../index.ts')
    for (const name of options.keys()) entrypointNames.add(name)
    return {
      membership: await import('./account-member.ts'),
      account: await import('./account-settings.ts'),
      dns: await import('./dns.ts'),
      dnsSettings: await import('./dns-settings.ts'),
      email: await import('./email-routing.ts'),
      notifications: await import('./notifications.ts'),
      assets: await import('./shared-assets.ts'),
      analytics: await import('./web-analytics.ts'),
      zeroTrust: await import('./zero-trust.ts'),
      zeroTrustSettings: await import('./zero-trust-settings.ts'),
      zoneSettings: await import('./zone-settings.ts'),
      applications: await import('./access-application.ts'),
      gateway: await import('./ai-gateway.ts'),
    }
  })
})

afterAll(() => vi.unstubAllEnvs())

describe('Cloudflare program ownership', () => {
  test('registers native protected resources with unique identities', () => {
    expect(resources).toHaveLength(76)
    expect([...entrypointNames].sort()).toEqual([...options.keys()].sort())
    expect(new Set(resources.map(({ type, name }) => `${type}/${name}`)).size).toBe(resources.length)
    expect(options.size).toBe(resources.length)
    for (const resource of resources) {
      expect(resource.custom).toBe(true)
      expect(options.get(resource.name)?.protect).toBe(true)
      expect(resource.type).toMatch(/^cloudflare:index\//)
    }
  })

  test('uses the configured account and zone throughout the program', async () => {
    const { zoneID } = await import('./config.ts')
    for (const { inputs } of resources) {
      if ('account' in inputs) expect(inputs.account).toEqual({ id: 'test-account' })
      if ('accountId' in inputs) expect(inputs.accountId).toBe('test-account')
      if ('zoneId' in inputs) expect(inputs.zoneId).toBe(zoneID)
      if ('zoneTag' in inputs) expect(inputs.zoneTag).toBe(zoneID)
    }
  })

  test('passes native lookup outputs through to the registered membership', () => {
    const member = resources.find(({ type }) => type === 'cloudflare:index/accountMember:AccountMember')
    expect(member?.inputs).not.toHaveProperty('roles')
    expect(member?.inputs).toMatchObject({
      policies: [
        {
          access: 'allow',
          permissionGroups: [{ id: 'program-permission-group' }],
          resourceGroups: [{ id: 'program-resource-group' }],
        },
      ],
    })
  })

  test('does not own application resources or unused Tunnel settings', () => {
    expect(resources.filter(({ type }) => /worker|pagesProject|zeroTrustTunnel/i.test(type))).toEqual([])
    expect(resources.filter(({ name, inputs }) => /openshell/i.test(`${name}/${String(inputs.name)}`))).toEqual([])
    const dns = resources.filter(({ type }) => type === 'cloudflare:index/dnsRecord:DnsRecord')
    expect(dns).toHaveLength(1)
    expect(dns[0]?.inputs.name).toBe('_dmarc.totto2727.dev')
    expect(dns.every(({ inputs }) => inputs.type === 'TXT')).toBe(true)
    expect(resources.filter(({ type }) => type === 'cloudflare:index/emailRoutingDns:EmailRoutingDns')).toHaveLength(2)
    expect(new Set(dns.map(({ inputs }) => `${String(inputs.name)}/${String(inputs.type)}`)).size).toBe(dns.length)
  })

  test('keeps URL normalization under one owner and does not infer unknown rules', () => {
    expect(resources.filter(({ type }) => type === 'cloudflare:index/ruleset:Ruleset')).toEqual([])
    expect(
      resources.filter(({ type }) => type === 'cloudflare:index/urlNormalizationSettings:UrlNormalizationSettings'),
    ).toHaveLength(1)
  })
})

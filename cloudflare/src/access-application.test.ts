import * as pulumi from '@pulumi/pulumi'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vite-plus/test'

const applicationType = 'cloudflare:index/zeroTrustAccessApplication:ZeroTrustAccessApplication'
const policyType = 'cloudflare:index/zeroTrustAccessPolicy:ZeroTrustAccessPolicy'
const tagType = 'cloudflare:index/zeroTrustAccessTag:ZeroTrustAccessTag'
const identityProviderType = 'cloudflare:index/zeroTrustAccessIdentityProvider:ZeroTrustAccessIdentityProvider'
const groupType = 'cloudflare:index/zeroTrustAccessGroup:ZeroTrustAccessGroup'
const resources: pulumi.runtime.MockResourceArgs[] = []
const resourceOptions = new Map<string, pulumi.CustomResourceOptions>()
let outputs: {
  cloudflareOsAccessAudience: string
  cloudflareOsAccessDomain: string
  projektorAccessAudience: string
  projektorAccessDomain: string
}

const mocks: pulumi.runtime.Mocks = {
  call: (args) => {
    switch (args.token) {
      case 'cloudflare:index/getAccountRoles:getAccountRoles':
        return { results: [{ name: 'Super Administrator - All Privileges', id: 'access-test-role' }] }
      case 'cloudflare:index/getAccountPermissionGroups:getAccountPermissionGroups':
        return { results: [{ name: 'Super Administrator - All Privileges', id: 'access-test-permission-group' }] }
      case 'cloudflare:index/getResourceGroups:getResourceGroups':
        return { results: [{ name: 'com.cloudflare.api.account.test-account', id: 'access-test-resource-group' }] }
      default:
        throw new Error(`Unexpected provider invocation: ${args.token}`)
    }
  },
  newResource: (args) => {
    resources.push(args)
    return {
      id: `id-${args.name}`,
      // oxlint-disable-next-line typescript/no-unsafe-assignment -- Pulumi declares provider mock inputs as any and expects them echoed as state.
      state: args.type === applicationType ? { ...args.inputs, aud: `aud-${args.name}` } : args.inputs,
    }
  },
}

beforeAll(async () => {
  vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'test-account')
  pulumi.runtime.setAllConfig({})
  await pulumi.runtime.setMocks(mocks, 'cloudflare', 'production')

  await pulumi.runtime.runInPulumiStack(async () => {
    pulumi.runtime.registerStackTransformation((args) => {
      if (args.type === applicationType || args.type === tagType) resourceOptions.set(args.name, args.opts)
      return { props: args.props, opts: args.opts }
    })
    const stack = await import('../index.ts')
    const { promise, resolve } = Promise.withResolvers<typeof outputs>()
    pulumi
      .all([
        stack.cloudflareOsAccessAudience,
        stack.cloudflareOsAccessDomain,
        stack.projektorAccessAudience,
        stack.projektorAccessDomain,
      ])
      .apply(
        ([cloudflareOsAccessAudience, cloudflareOsAccessDomain, projektorAccessAudience, projektorAccessDomain]) => {
          resolve({
            cloudflareOsAccessAudience,
            cloudflareOsAccessDomain,
            projektorAccessAudience,
            projektorAccessDomain,
          })
        },
      )
    outputs = await promise
    return {}
  })
})

afterAll(() => {
  pulumi.runtime.setAllConfig({})
  vi.unstubAllEnvs()
})

describe('Deployment Access applications', () => {
  test('protects both fixed hostnames without hostname stack configuration', () => {
    const applications = resources.filter((resource) => resource.type === applicationType)
    expect(applications).toHaveLength(2)

    for (const [name, domain] of [
      ['projektor', 'projektor.totto2727.dev'],
      ['cloudflare-os', 'cloudflare.totto2727.dev'],
    ]) {
      expect(applications.find((application) => application.name === `iac-prod-${name}`)).toMatchObject({
        inputs: {
          accountId: 'test-account',
          allowedIdps: ['id-iac-prod-passkeys-identity-provider'],
          appLauncherVisible: true,
          autoRedirectToIdentity: false,
          destinations: [{ type: 'public', uri: domain }],
          domain,
          name: `iac-prod-${name}`,
          policies: [{ id: 'id-iac-prod-must-authenticate-with-passkeys', precedence: 1 }],
          sessionDuration: '24h',
          type: 'self_hosted',
        },
      })
    }
  })

  test('removes SAML resources without adding another authentication path', () => {
    expect(resources.filter((resource) => resource.name.includes('saml'))).toEqual([])
    expect(resources.filter((resource) => resource.type === policyType)).toHaveLength(1)
    expect(resources.filter((resource) => resource.type === groupType)).toHaveLength(1)
  })

  test('preserves the passkey provider alongside the existing account OTP provider', () => {
    const providers = resources.filter((resource) => resource.type === identityProviderType)
    expect(providers).toHaveLength(2)
    expect(providers.find((provider) => provider.name === 'iac-prod-passkeys-identity-provider')?.inputs).toEqual({
      accountId: 'test-account',
      config: { loginPageAutoPrompt: false },
      name: 'iac-prod-passkeys',
      type: 'passkeys',
    })
    expect(
      providers.find((provider) => provider.name === 'iac-prod-one-time-pin-identity-provider')?.inputs,
    ).toMatchObject({
      type: 'onetimepin',
    })
  })

  test('requires both an assigned email and the passkey login method', () => {
    const passkeyGroup = resources.find((resource) => resource.name === 'iac-prod-passkey-users-access-group')
    expect(passkeyGroup?.type).toBe(groupType)
    expect(passkeyGroup?.inputs).toEqual({
      accountId: 'test-account',
      includes: [
        { email: { email: 'kaihatu.totto2727@gmail.com' } },
        { email: { email: 'hayato.2000.0727@gmail.com' } },
      ],
      name: 'iac-prod-passkey-users',
      requires: [{ loginMethod: { id: 'id-iac-prod-passkeys-identity-provider' } }],
    })
    expect(resources.find((resource) => resource.name === 'iac-prod-must-authenticate-with-passkeys')?.inputs).toEqual({
      accountId: 'test-account',
      decision: 'allow',
      includes: [{ group: { id: 'id-iac-prod-passkey-users-access-group' } }],
      name: 'iac-prod-must-authenticate-with-passkeys',
      sessionDuration: '24h',
    })
  })

  test('creates ownership tags once and attaches them to both applications', () => {
    const tagNames = [
      'environment:production',
      'managed-by:pulumi',
      'pulumi-project:cloudflare',
      'pulumi-stack:production',
      'repository:totto2727-org/monorepo',
    ]
    const registeredTags = resources.filter((resource) => resource.type === tagType)
    expect(registeredTags).toHaveLength(tagNames.length)
    expect(registeredTags).toEqual(
      ['environment', 'managedBy', 'pulumiProject', 'pulumiStack', 'repository'].map((key, index) =>
        expect.objectContaining({
          name: `iac-prod-access-tag-${key}`,
          inputs: { accountId: 'test-account', name: tagNames[index] },
        }),
      ),
    )
    for (const resource of resources.filter(
      (resource) => resource.type === tagType || resource.type === applicationType,
    )) {
      expect(resourceOptions.get(resource.name)?.protect).toBe(true)
    }
    for (const application of resources.filter((resource) => resource.type === applicationType)) {
      expect(application.inputs).toMatchObject({ tags: tagNames })
    }
  })

  test('exports distinct provider audiences rather than application or policy IDs', () => {
    expect(outputs).toEqual({
      cloudflareOsAccessAudience: 'aud-iac-prod-cloudflare-os',
      cloudflareOsAccessDomain: 'cloudflare.totto2727.dev',
      projektorAccessAudience: 'aud-iac-prod-projektor',
      projektorAccessDomain: 'projektor.totto2727.dev',
    })
  })
})

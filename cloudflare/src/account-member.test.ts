import * as pulumi from '@pulumi/pulumi'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vite-plus/test'

const resources: pulumi.runtime.MockResourceArgs[] = []
const options: pulumi.CustomResourceOptions[] = []
const calls: pulumi.runtime.MockCallArgs[] = []

beforeAll(async () => {
  vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', '5643a837ef66765e7881c0831a36ebed')
  await pulumi.runtime.setMocks(
    {
      call: (args) => {
        calls.push(args)
        switch (args.token) {
          case 'cloudflare:index/getAccountRoles:getAccountRoles':
            return {
              results: [
                { name: 'Administrator', id: 'unrelated-role' },
                { name: 'Super Administrator - All Privileges', id: 'resolved-role' },
              ],
            }
          case 'cloudflare:index/getAccountPermissionGroups:getAccountPermissionGroups':
            return { results: [{ name: 'Super Administrator - All Privileges', id: 'resolved-permission-group' }] }
          case 'cloudflare:index/getResourceGroups:getResourceGroups':
            return {
              results: [
                { name: 'com.cloudflare.api.account.other', id: 'unrelated-scope' },
                { name: 'com.cloudflare.api.account.5643a837ef66765e7881c0831a36ebed', id: 'resolved-resource-group' },
              ],
            }
          default:
            throw new Error(`Unexpected provider invocation: ${args.token}`)
        }
      },
      newResource: (args) => {
        if (args.custom) resources.push(args)
        // oxlint-disable-next-line typescript/no-unsafe-assignment -- Pulumi mock inputs are any and must be echoed as state.
        return { id: args.id, state: args.inputs }
      },
    },
    'cloudflare',
    'production',
  )
  await pulumi.runtime.runInPulumiStack(async () => {
    pulumi.runtime.registerStackTransformation((args) => {
      if (args.type === 'cloudflare:index/accountMember:AccountMember') options.push(args.opts)
      return undefined
    })
    const { accountMember } = await import('./account-member.ts')
    return { accountMemberId: accountMember.id }
  })
})

afterAll(() => {
  vi.unstubAllEnvs()
})

describe('Existing account membership', () => {
  test('assigns provider-resolved IDs while preserving the accepted administrator', () => {
    expect(resources).toHaveLength(1)
    expect(resources[0]).toMatchObject({
      type: 'cloudflare:index/accountMember:AccountMember',
      name: 'iac-prod-account-member',
      id: '5643a837ef66765e7881c0831a36ebed/8cea2300211fbc6fdd1600cf4e60a27d',
    })
    expect(resources[0]?.inputs).toEqual({
      accountId: '5643a837ef66765e7881c0831a36ebed',
      email: 'kaihatu.totto2727@gmail.com',
      status: 'accepted',
      roles: ['resolved-role'],
      policies: [
        {
          access: 'allow',
          permissionGroups: [{ id: 'resolved-permission-group' }],
          resourceGroups: [{ id: 'resolved-resource-group' }],
        },
      ],
    })
  })

  test('looks up exact names within the configured account', () => {
    expect(calls).toHaveLength(3)
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          token: 'cloudflare:index/getAccountRoles:getAccountRoles',
          inputs: { accountId: '5643a837ef66765e7881c0831a36ebed', maxItems: 1000 },
        }),
        expect.objectContaining({
          token: 'cloudflare:index/getAccountPermissionGroups:getAccountPermissionGroups',
          inputs: {
            accountId: '5643a837ef66765e7881c0831a36ebed',
            name: 'Super Administrator - All Privileges',
            maxItems: 1000,
          },
        }),
        expect.objectContaining({
          token: 'cloudflare:index/getResourceGroups:getResourceGroups',
          inputs: {
            accountId: '5643a837ef66765e7881c0831a36ebed',
            name: 'com.cloudflare.api.account.5643a837ef66765e7881c0831a36ebed',
            maxItems: 1000,
          },
        }),
      ]),
    )
  })

  test('imports and protects the existing membership without creating built-in groups', () => {
    expect(options).toHaveLength(1)
    expect(options[0]).toMatchObject({
      import: '5643a837ef66765e7881c0831a36ebed/8cea2300211fbc6fdd1600cf4e60a27d',
      protect: true,
    })
    expect(resources.map((resource) => resource.type)).toEqual(['cloudflare:index/accountMember:AccountMember'])
  })
})

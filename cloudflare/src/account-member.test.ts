import * as pulumi from '@pulumi/pulumi'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vite-plus/test'

const resources: pulumi.runtime.MockResourceArgs[] = []
const options: pulumi.CustomResourceOptions[] = []

beforeAll(async () => {
  vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', '5643a837ef66765e7881c0831a36ebed')
  await pulumi.runtime.setMocks(
    {
      call: (args) => {
        throw new Error(`Unexpected provider invocation: ${args.token}`)
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
  test('preserves the accepted administrator and exact role and policy assignments', () => {
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
      roles: ['33666b9c79b9a5273fc7344ff42f953d'],
      policies: [
        {
          access: 'allow',
          permissionGroups: [{ id: '8e23b19e4e0d44c29d239c5688ba8cbb' }],
          resourceGroups: [{ id: 'f4b2044943cc427693c60781a4c99ece' }],
        },
      ],
    })
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

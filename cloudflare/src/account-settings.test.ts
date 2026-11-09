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
      if (args.type === 'cloudflare:index/account:Account') options.push(args.opts)
      return undefined
    })
    const { account } = await import('./account-settings.ts')
    return { accountId: account.id }
  })
})

afterAll(() => {
  vi.unstubAllEnvs()
})

describe('Shared account settings', () => {
  test('adopts the existing account with its name and enforced two-factor authentication unchanged', () => {
    expect(resources).toHaveLength(1)
    expect(resources[0]).toMatchObject({
      type: 'cloudflare:index/account:Account',
      name: 'iac-prod-account-settings',
      id: '5643a837ef66765e7881c0831a36ebed',
    })
    expect(resources[0]?.inputs).toEqual({
      name: "Kaihatu.totto2727@gmail.com's Account",
      settings: { enforceTwofactor: true },
    })
  })

  test('protects the imported account without taking ownership of memberships or account creation options', () => {
    expect(options).toHaveLength(1)
    expect(options[0]).toMatchObject({ import: '5643a837ef66765e7881c0831a36ebed', protect: true })
  })
})

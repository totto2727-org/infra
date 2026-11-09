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
      if (args.type === 'cloudflare:index/notificationPolicy:NotificationPolicy') options.push(args.opts)
      return undefined
    })
    const { webAnalytics } = await import('./notifications.ts')
    return { webAnalyticsId: webAnalytics.id }
  })
})

afterAll(() => {
  vi.unstubAllEnvs()
})

describe('Shared notifications', () => {
  test('preserves the existing Analytics policy settings and exact recipient', () => {
    expect(resources).toHaveLength(1)
    expect(resources[0]).toMatchObject({
      type: 'cloudflare:index/notificationPolicy:NotificationPolicy',
      name: 'iac-prod-web-analytics-notification',
      id: '5643a837ef66765e7881c0831a36ebed/81dcb2b1c9a74fd68a4666bf187f8eef',
    })
    expect(resources[0]?.inputs).toEqual({
      accountId: '5643a837ef66765e7881c0831a36ebed',
      alertType: 'web_analytics_metrics_update',
      description: 'Default Web Analytics Metrics Update',
      enabled: true,
      mechanisms: { emails: [{ id: 'kaihatu.totto2727@gmail.com' }] },
      name: 'Default Web Analytics Metrics Update',
    })
  })

  test('protects the existing Analytics import and leaves the unsupported USD 10 budget policy unmanaged', () => {
    expect(options).toHaveLength(1)
    expect(options[0]).toMatchObject({
      import: '5643a837ef66765e7881c0831a36ebed/81dcb2b1c9a74fd68a4666bf187f8eef',
      protect: true,
    })
    expect(resources.map((resource) => resource.id)).not.toContain(
      '5643a837ef66765e7881c0831a36ebed/64d4e770f1c34faea161a193494f209a',
    )
  })
})

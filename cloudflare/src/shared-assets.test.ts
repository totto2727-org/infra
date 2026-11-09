import * as pulumi from '@pulumi/pulumi'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vite-plus/test'

const resources: pulumi.runtime.MockResourceArgs[] = []
const options = new Map<string, pulumi.CustomResourceOptions>()

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
      if (args.type === 'cloudflare:index/zone:Zone' || args.type === 'cloudflare:index/imageVariant:ImageVariant') {
        options.set(args.name, args.opts)
      }
      return undefined
    })
    const { zone, publicImageVariant } = await import('./shared-assets.ts')
    return { zoneId: zone.id, imageVariantId: publicImageVariant.id }
  })
})

afterAll(() => {
  vi.unstubAllEnvs()
})

describe('Shared account and Zone assets', () => {
  test('adopts the current full Zone without changing its activation or nameservers', () => {
    expect(resources.find((resource) => resource.name === 'iac-prod-zone')).toMatchObject({
      type: 'cloudflare:index/zone:Zone',
      id: '502c8e36ae3b0e13da67e015e67c6b35',
      inputs: {
        account: { id: '5643a837ef66765e7881c0831a36ebed' },
        name: 'totto2727.dev',
        paused: false,
        type: 'full',
        vanityNameServers: [],
      },
    })
    expect(options.get('iac-prod-zone')).toMatchObject({
      import: '502c8e36ae3b0e13da67e015e67c6b35',
      protect: true,
    })
  })

  test('preserves the public image variant dimensions, metadata and signature policy', () => {
    expect(resources.find((resource) => resource.name === 'iac-prod-image-variant-public')).toMatchObject({
      type: 'cloudflare:index/imageVariant:ImageVariant',
      id: '5643a837ef66765e7881c0831a36ebed/public',
      inputs: {
        accountId: '5643a837ef66765e7881c0831a36ebed',
        imageVariantId: 'public',
        neverRequireSignedUrls: false,
        options: { fit: 'scale-down', width: 1366, height: 768, metadata: 'none' },
      },
    })
    expect(options.get('iac-prod-image-variant-public')).toMatchObject({
      import: '5643a837ef66765e7881c0831a36ebed/public',
      protect: true,
    })
  })

  test('owns only the shared Zone and image variant, not certificates or registrar objects', () => {
    expect(resources).toHaveLength(2)
  })
})

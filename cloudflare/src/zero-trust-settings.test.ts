import * as pulumi from '@pulumi/pulumi'
import { afterAll, beforeAll, expect, test, vi } from 'vite-plus/test'

const resources: pulumi.runtime.MockResourceArgs[] = []
const options = new Map<string, pulumi.CustomResourceOptions>()

beforeAll(async () => {
  vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'test-account')
  await pulumi.runtime.setMocks(
    {
      call: (args) => {
        throw new Error(`Unexpected provider invocation: ${args.token}`)
      },
      newResource: (args) => {
        if (args.type !== 'pulumi:pulumi:Stack') resources.push(args)
        // oxlint-disable-next-line typescript/no-unsafe-assignment -- Echo native mock inputs as resource state.
        return { id: args.id, state: args.inputs }
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
    const settings = await import('./zero-trust-settings.ts')
    await Promise.all(
      Object.values(settings).map((resource) => new Promise<void>((resolve) => resource.urn.apply(() => resolve()))),
    )
    return {}
  })
})

afterAll(() => vi.unstubAllEnvs())

const expectedResources = [
  {
    name: 'zero-trust-organization',
    token: 'zeroTrustOrganization:ZeroTrustOrganization',
    id: 'test-account',
    inputs: {
      accountId: 'test-account',
      authDomain: 'totto2727.cloudflareaccess.com',
      name: 'totto2727.cloudflareaccess.com',
      loginDesign: {},
      isUiReadOnly: false,
      allowAuthenticateViaWarp: false,
      warpAuthNonBrowser401: false,
      denyUnmatchedRequests: false,
      denyUnmatchedRequestsExemptedZoneNames: [],
    },
  },
  {
    name: 'gateway-settings',
    token: 'zeroTrustGatewaySettings:ZeroTrustGatewaySettings',
    id: 'test-account',
    inputs: {
      accountId: 'test-account',
      settings: {
        tlsDecrypt: { enabled: false },
        extendedEmailMatching: { enabled: false },
        certificate: { id: 'aab62902-08c8-4a06-aee7-fea2b805c45c' },
      },
    },
  },
  {
    name: 'default-dns-location',
    token: 'zeroTrustDnsLocation:ZeroTrustDnsLocation',
    id: 'test-account/bc7353169b28418ea3b00c598069cce3',
    inputs: {
      accountId: 'test-account',
      name: 'Default Location',
      networks: [],
      clientDefault: true,
      ecsSupport: false,
      dnsDestinationIpsId: '0e4a32c6-6fb8-4858-9296-98f51631e8e6',
      maxTtl: { mode: 'inherit' },
    },
  },
  {
    name: 'default-device-profile',
    token: 'zeroTrustDeviceDefaultProfile:ZeroTrustDeviceDefaultProfile',
    id: 'test-account',
    inputs: {
      accountId: 'test-account',
      allowModeSwitch: false,
      allowUpdates: false,
      allowedToLeave: true,
      autoConnect: 0,
      captivePortal: 180,
      disableAutoFallback: false,
      serviceModeV2: { mode: 'warp' },
      supportUrl: '',
      switchLocked: false,
      excludes: [
        { address: '10.0.0.0/8' },
        { address: '100.64.0.0/10' },
        { address: '169.254.0.0/16', description: 'DHCP Unspecified' },
        { address: '172.16.0.0/12' },
        { address: '192.0.0.0/24' },
        { address: '192.168.0.0/16' },
        { address: '224.0.0.0/24' },
        { address: '240.0.0.0/4' },
        { address: '255.255.255.255/32', description: 'DHCP Broadcast' },
        { address: 'fe80::/10', description: 'IPv6 Link Local' },
        { address: 'fd00::/8' },
        { address: 'ff01::/16' },
        { address: 'ff02::/16' },
        { address: 'ff03::/16' },
        { address: 'ff04::/16' },
        { address: 'ff05::/16' },
      ],
      excludeOfficeIps: false,
      dnsSearchSuffixes: [],
      registerInterfaceIpWithDns: true,
      sccmVpnBoundarySupport: false,
      uninstallProtection: false,
      tunnelProtocol: '',
    },
  },
  {
    name: 'default-device-local-domain-fallback',
    token: 'zeroTrustDeviceDefaultProfileLocalDomainFallback:ZeroTrustDeviceDefaultProfileLocalDomainFallback',
    id: 'test-account',
    inputs: {
      accountId: 'test-account',
      domains: [
        { suffix: 'home.arpa' },
        { suffix: 'intranet' },
        { suffix: 'internal' },
        { suffix: 'private' },
        { suffix: 'localdomain' },
        { suffix: 'domain' },
        { suffix: 'lan' },
        { suffix: 'home' },
        { suffix: 'host' },
        { suffix: 'corp' },
        { suffix: 'local' },
        { suffix: 'localhost' },
        { suffix: 'invalid' },
        { suffix: 'test' },
      ],
    },
  },
  {
    name: 'connectivity-settings',
    token: 'zeroTrustConnectivitySettings:ZeroTrustConnectivitySettings',
    id: 'test-account',
    inputs: { accountId: 'test-account', icmpProxyEnabled: false, offrampWarpEnabled: false },
  },
  {
    name: 'dlp-settings',
    token: 'zeroTrustDlpSettings:ZeroTrustDlpSettings',
    id: 'test-account',
    inputs: {
      accountId: 'test-account',
      aiContextAnalysis: false,
      ocr: false,
      payloadLogging: { maskingLevel: 'default' },
    },
  },
  {
    name: 'one-time-pin-identity-provider',
    token: 'zeroTrustAccessIdentityProvider:ZeroTrustAccessIdentityProvider',
    id: 'accounts/test-account/5b7f588f-66e8-434e-bb36-a69a837a61ed',
    inputs: {
      accountId: 'test-account',
      name: '',
      type: 'onetimepin',
      config: {},
    },
  },
]

for (const expected of expectedResources) {
  test(`imports and protects ${expected.name} with exact observed native inputs`, () => {
    const name = `iac-prod-${expected.name}`
    expect(resources.find((resource) => resource.name === name)).toEqual(
      expect.objectContaining({
        custom: true,
        id: expected.id,
        name,
        type: `cloudflare:index/${expected.token}`,
        inputs: expected.inputs,
      }),
    )
    expect(options.get(name)).toEqual(expect.objectContaining({ import: expected.id, protect: true }))
  })
}

test('registers only native shared settings, not managed catalogs or other-app resources', () => {
  expect(resources).toHaveLength(expectedResources.length + 1)
  expect(options.size).toBe(expectedResources.length + 1)
  expect(resources.every((resource) => resource.type.startsWith('cloudflare:index/'))).toBe(true)
})

test('uses authorized native singleton initialization for the five existing device settings without a fake import', () => {
  expect(resources.find((resource) => resource.name === 'iac-prod-device-settings')).toEqual(
    expect.objectContaining({
      custom: true,
      name: 'iac-prod-device-settings',
      type: 'cloudflare:index/zeroTrustDeviceSettings:ZeroTrustDeviceSettings',
      inputs: {
        accountId: 'test-account',
        gatewayProxyEnabled: false,
        gatewayUdpProxyEnabled: false,
        rootCertificateInstallationEnabled: false,
        disableForTime: 0,
        useZtVirtualIp: false,
      },
    }),
  )
  expect(options.get('iac-prod-device-settings')).toEqual(expect.objectContaining({ protect: true }))
  expect(options.get('iac-prod-device-settings')).not.toHaveProperty('import')
})

test('does not fabricate disabled organization inactivity values or redacted authentication settings', () => {
  const organization = resources.find((resource) => resource.name === 'iac-prod-zero-trust-organization')
  expect(organization?.inputs).not.toHaveProperty('serviceTokenInactivity')
  expect(organization?.inputs).not.toHaveProperty('strictServiceTokenAuth')
  expect(options.get('iac-prod-zero-trust-organization')).toEqual(
    expect.objectContaining({ ignoreChanges: ['serviceTokenInactivity', 'strictServiceTokenAuth'] }),
  )
})

test('OTP omits computed callbacks and SCIM configuration unsupported by onetimepin', () => {
  const identityProvider = resources.find((resource) => resource.name === 'iac-prod-one-time-pin-identity-provider')
  expect(identityProvider?.inputs).toHaveProperty('config', {})
  expect(identityProvider?.inputs).not.toHaveProperty('config.redirectUrl')
  expect(identityProvider?.inputs).not.toHaveProperty('scimConfig')
})

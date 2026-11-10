import * as pulumi from '@pulumi/pulumi'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vite-plus/test'

let zoneId: string
const settingType = 'cloudflare:index/zoneSetting:ZoneSetting'
const resources: pulumi.runtime.MockResourceArgs[] = []
const options = new Map<string, pulumi.CustomResourceOptions>()

// Independent expectations transcribed from the audit's editable setting responses.
const observedSettings = [
  ['always_online', 'off'],
  ['always_use_https', 'on'],
  ['automatic_https_rewrites', 'on'],
  ['brotli', 'on'],
  ['browser_cache_ttl', 0],
  ['browser_check', 'on'],
  ['cache_level', 'aggressive'],
  ['challenge_ttl', 1800],
  ['ciphers', []],
  ['development_mode', 'off'],
  ['early_hints', 'on'],
  ['email_obfuscation', 'off'],
  ['hotlink_protection', 'on'],
  ['http3', 'on'],
  ['ip_geolocation', 'on'],
  ['ipv6', 'on'],
  ['max_upload', 100],
  ['min_tls_version', '1.3'],
  ['mirage', 'off'],
  ['opportunistic_encryption', 'off'],
  ['opportunistic_onion', 'on'],
  ['origin_max_http_version', '2'],
  ['origin_h2_max_streams', 100],
  ['pseudo_ipv4', 'off'],
  ['rocket_loader', 'off'],
  [
    'security_header',
    {
      strict_transport_security: {
        enabled: false,
        max_age: 0,
        include_subdomains: false,
        preload: false,
        nosniff: false,
      },
    },
  ],
  ['security_level', 'medium'],
  ['server_side_exclude', 'on'],
  ['tls_1_3', 'zrt'],
  ['waf', 'off'],
  ['websockets', 'on'],
] as const

const observedSingletons = [
  ['urlNormalizationSettings:UrlNormalizationSettings', { type: 'cloudflare', scope: 'both' }],
  ['tieredCache:TieredCache', { value: 'on' }],
  [
    'botManagement:BotManagement',
    {
      enableJs: true,
      fightMode: true,
      aiBotsProtection: 'disabled',
      contentBotsProtection: 'disabled',
      crawlerProtection: 'enabled',
      aiTraining: 'disabled',
      aisearch: 'disabled',
      aiUser: 'disabled',
      isRobotsTxtManaged: false,
      botPreferenceSyncEnabled: false,
      cfRobotsVariant: 'policy_only',
      aiBotsMigrationOptOut: false,
    },
  ],
  [
    'managedTransforms:ManagedTransforms',
    {
      managedRequestHeaders: [
        { id: 'add_client_certificate_headers', enabled: false },
        { id: 'add_visitor_location_headers', enabled: false },
        { id: 'remove_visitor_ip_headers', enabled: true },
        { id: 'add_waf_credential_check_status_header', enabled: false },
      ],
      managedResponseHeaders: [
        { id: 'remove_x-powered-by_header', enabled: true },
        { id: 'add_security_headers', enabled: true },
      ],
    },
  ],
  ['universalSslSetting:UniversalSslSetting', { enabled: true }],
  ['authenticatedOriginPullsSettings:AuthenticatedOriginPullsSettings', { enabled: false }],
  ['zoneAutoOriginTlsKex:ZoneAutoOriginTlsKex', { enabled: true }],
  ['originTlsComplianceModes:OriginTlsComplianceModes', { values: [] }],
  ['ctAlerting:CtAlerting', { enabled: true, emails: ['kaihatu.totto2727@gmail.com'] }],
] as const

beforeAll(async () => {
  vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'test-account')
  await pulumi.runtime.setMocks(
    {
      call: (args) => {
        throw new Error(`Unexpected provider invocation: ${args.token}`)
      },
      newResource: (args) => {
        if (args.type.startsWith('cloudflare:')) resources.push(args)
        // oxlint-disable-next-line typescript/no-unsafe-assignment -- Pulumi mock inputs are any and the mock boundary echoes them as state.
        return { id: args.id || args.name, state: args.inputs }
      },
    },
    'cloudflare',
    'production',
  )

  await pulumi.runtime.runInPulumiStack(async () => {
    pulumi.runtime.registerStackTransformation((args) => {
      if (args.type.startsWith('cloudflare:')) options.set(args.name, args.opts)
      return { props: args.props, opts: args.opts }
    })
    const config = await import('./config.ts')
    zoneId = config.zoneID
    const settings = await import('./zone-settings.ts')
    const { promise, resolve } = Promise.withResolvers<void>()
    pulumi
      .all([
        settings.zoneAlwaysOnline.id,
        settings.zoneAlwaysUseHttps.id,
        settings.zoneAutomaticHttpsRewrites.id,
        settings.zoneBrotli.id,
        settings.zoneBrowserCacheTtl.id,
        settings.zoneBrowserCheck.id,
        settings.zoneCacheLevel.id,
        settings.zoneChallengeTtl.id,
        settings.zoneCiphers.id,
        settings.zoneDevelopmentMode.id,
        settings.zoneEarlyHints.id,
        settings.zoneEmailObfuscation.id,
        settings.zoneHotlinkProtection.id,
        settings.zoneHttp3.id,
        settings.zoneIpGeolocation.id,
        settings.zoneIpv6.id,
        settings.zoneMaxUpload.id,
        settings.zoneMinTlsVersion.id,
        settings.zoneMirage.id,
        settings.zoneOpportunisticEncryption.id,
        settings.zoneOpportunisticOnion.id,
        settings.zoneOriginMaxHttpVersion.id,
        settings.zoneOriginH2MaxStreams.id,
        settings.zonePseudoIpv4.id,
        settings.zoneRocketLoader.id,
        settings.zoneSecurityHeader.id,
        settings.zoneSecurityLevel.id,
        settings.zoneServerSideExclude.id,
        settings.zoneTls13.id,
        settings.zoneWaf.id,
        settings.zoneWebsockets.id,
        settings.zoneDnssec.id,
        settings.zoneUrlNormalization.id,
        settings.zoneSmartTieredCache.id,
        settings.zoneBotManagement.id,
        settings.zoneManagedTransforms.id,
        settings.zoneUniversalSsl.id,
        settings.zoneAuthenticatedOriginPulls.id,
        settings.zoneAutoOriginTlsKex.id,
        settings.zoneOriginTlsCompliance.id,
        settings.zoneCtAlerting.id,
      ])
      .apply(() => {
        resolve()
      })
    await promise
    return {}
  })
})

afterAll(() => {
  vi.unstubAllEnvs()
})

describe('Zone settings', () => {
  test.each(observedSettings)('adopts observed %s without changing its value', (settingId, value) => {
    const matching = resources.filter((resource) => resource.id === `${zoneId}/${settingId}`)
    expect(matching).toHaveLength(1)
    expect(matching[0]).toMatchObject({ type: settingType, inputs: { zoneId, settingId, value } })
    expect(matching[0]?.inputs).toEqual({ zoneId, settingId, value })
  })

  test.each(observedSingletons)('adopts existing %s with only confirmed writable inputs', (type, inputs) => {
    const matching = resources.filter((resource) => resource.type === `cloudflare:index/${type}`)
    expect(matching).toHaveLength(1)
    expect(matching[0]).toMatchObject({ id: zoneId, inputs: { zoneId, ...inputs } })
    expect(matching[0]?.inputs).toEqual({ zoneId, ...inputs })
  })

  test('enables DNSSEC on the existing protected zone without changing its identity', () => {
    const matching = resources.filter((resource) => resource.type === 'cloudflare:index/zoneDnssec:ZoneDnssec')
    expect(matching).toHaveLength(1)
    expect(matching[0]).toMatchObject({ id: zoneId, name: 'iac-prod-zone-dnssec' })
    expect(matching[0]?.inputs).toEqual({ zoneId, status: 'active' })
    expect(options.get('iac-prod-zone-dnssec')).toMatchObject({ import: zoneId, protect: true })
    expect(options.get('iac-prod-zone-dnssec')?.ignoreChanges).toBeUndefined()
  })

  test('requires an existing import and deletion protection for every native resource', () => {
    expect(resources).toHaveLength(41)
    expect(options.size).toBe(41)
    for (const resource of resources) {
      expect(resource.custom).toBe(true)
      expect(resource.name).toMatch(/^iac-prod-zone-/)
      expect(resource.id).toMatch(new RegExp(`^${zoneId}(/[^/]+)?$`))
      expect(options.get(resource.name)).toMatchObject({ import: resource.id, protect: true })
      expect(options.get(resource.name)?.ignoreChanges).toBeUndefined()
    }
    expect(new Set(resources.map((resource) => `${resource.type}/${resource.id}`)).size).toBe(41)
  })

  test('leaves automatic SSL, readonly and unsupported settings and unknown rulesets unmanaged', () => {
    const settingIds: unknown[] = resources
      .filter((resource) => resource.type === settingType)
      .map((resource) => resource.inputs.settingId)
    for (const excluded of [
      'ssl',
      'ssl_automatic_mode',
      'http2',
      'origin_error_page_pass_thru',
      'polish',
      'minify',
      'speed_brain',
      'bot_fight_mode',
      '0rtt',
      'automatic_platform_optimization',
      'image_resizing',
      'rum',
    ])
      expect(settingIds).not.toContain(excluded)
    expect(resources.some((resource) => resource.type === 'cloudflare:index/ruleset:Ruleset')).toBe(false)
  })
})

import * as cloudflare from '@pulumi/cloudflare'

import { resourceName, zoneID as zoneId } from './config.ts'

// Current values from the 2026-11-08/09 audit of totto2727.dev, not a hardening policy.
// Keep SSL's observed flexible mode under Cloudflare automatic SSL management (auto).
// Declaring ssl here would compete with that controller. Its automatic-mode API has no dedicated resource.
// Read-only settings, unconfirmed values and settings absent from the provider's documented IDs stay unmanaged.
export const zoneAlwaysOnline = new cloudflare.ZoneSetting(
  resourceName('zone-always-online'),
  { zoneId, settingId: 'always_online', value: 'off' },
  { import: `${zoneId}/always_online`, protect: true },
)
export const zoneAlwaysUseHttps = new cloudflare.ZoneSetting(
  resourceName('zone-always-use-https'),
  { zoneId, settingId: 'always_use_https', value: 'on' },
  { import: `${zoneId}/always_use_https`, protect: true },
)
export const zoneAutomaticHttpsRewrites = new cloudflare.ZoneSetting(
  resourceName('zone-automatic-https-rewrites'),
  { zoneId, settingId: 'automatic_https_rewrites', value: 'on' },
  { import: `${zoneId}/automatic_https_rewrites`, protect: true },
)
export const zoneBrotli = new cloudflare.ZoneSetting(
  resourceName('zone-brotli'),
  { zoneId, settingId: 'brotli', value: 'on' },
  { import: `${zoneId}/brotli`, protect: true },
)
export const zoneBrowserCacheTtl = new cloudflare.ZoneSetting(
  resourceName('zone-browser-cache-ttl'),
  { zoneId, settingId: 'browser_cache_ttl', value: 0 },
  { import: `${zoneId}/browser_cache_ttl`, protect: true },
)
export const zoneBrowserCheck = new cloudflare.ZoneSetting(
  resourceName('zone-browser-check'),
  { zoneId, settingId: 'browser_check', value: 'on' },
  { import: `${zoneId}/browser_check`, protect: true },
)
export const zoneCacheLevel = new cloudflare.ZoneSetting(
  resourceName('zone-cache-level'),
  { zoneId, settingId: 'cache_level', value: 'aggressive' },
  { import: `${zoneId}/cache_level`, protect: true },
)
export const zoneChallengeTtl = new cloudflare.ZoneSetting(
  resourceName('zone-challenge-ttl'),
  { zoneId, settingId: 'challenge_ttl', value: 1800 },
  { import: `${zoneId}/challenge_ttl`, protect: true },
)
export const zoneCiphers = new cloudflare.ZoneSetting(
  resourceName('zone-ciphers'),
  { zoneId, settingId: 'ciphers', value: [] },
  { import: `${zoneId}/ciphers`, protect: true },
)
export const zoneDevelopmentMode = new cloudflare.ZoneSetting(
  resourceName('zone-development-mode'),
  { zoneId, settingId: 'development_mode', value: 'off' },
  { import: `${zoneId}/development_mode`, protect: true },
)
export const zoneEarlyHints = new cloudflare.ZoneSetting(
  resourceName('zone-early-hints'),
  { zoneId, settingId: 'early_hints', value: 'on' },
  { import: `${zoneId}/early_hints`, protect: true },
)
export const zoneEmailObfuscation = new cloudflare.ZoneSetting(
  resourceName('zone-email-obfuscation'),
  { zoneId, settingId: 'email_obfuscation', value: 'off' },
  { import: `${zoneId}/email_obfuscation`, protect: true },
)
export const zoneHotlinkProtection = new cloudflare.ZoneSetting(
  resourceName('zone-hotlink-protection'),
  { zoneId, settingId: 'hotlink_protection', value: 'on' },
  { import: `${zoneId}/hotlink_protection`, protect: true },
)
export const zoneHttp3 = new cloudflare.ZoneSetting(
  resourceName('zone-http3'),
  { zoneId, settingId: 'http3', value: 'on' },
  { import: `${zoneId}/http3`, protect: true },
)
export const zoneIpGeolocation = new cloudflare.ZoneSetting(
  resourceName('zone-ip-geolocation'),
  { zoneId, settingId: 'ip_geolocation', value: 'on' },
  { import: `${zoneId}/ip_geolocation`, protect: true },
)
export const zoneIpv6 = new cloudflare.ZoneSetting(
  resourceName('zone-ipv6'),
  { zoneId, settingId: 'ipv6', value: 'on' },
  { import: `${zoneId}/ipv6`, protect: true },
)
export const zoneMaxUpload = new cloudflare.ZoneSetting(
  resourceName('zone-max-upload'),
  { zoneId, settingId: 'max_upload', value: 100 },
  { import: `${zoneId}/max_upload`, protect: true },
)
export const zoneMinTlsVersion = new cloudflare.ZoneSetting(
  resourceName('zone-min-tls-version'),
  { zoneId, settingId: 'min_tls_version', value: '1.3' },
  { import: `${zoneId}/min_tls_version`, protect: true },
)
export const zoneMirage = new cloudflare.ZoneSetting(
  resourceName('zone-mirage'),
  { zoneId, settingId: 'mirage', value: 'off' },
  { import: `${zoneId}/mirage`, protect: true },
)
export const zoneOpportunisticEncryption = new cloudflare.ZoneSetting(
  resourceName('zone-opportunistic-encryption'),
  { zoneId, settingId: 'opportunistic_encryption', value: 'off' },
  { import: `${zoneId}/opportunistic_encryption`, protect: true },
)
export const zoneOpportunisticOnion = new cloudflare.ZoneSetting(
  resourceName('zone-opportunistic-onion'),
  { zoneId, settingId: 'opportunistic_onion', value: 'on' },
  { import: `${zoneId}/opportunistic_onion`, protect: true },
)
export const zoneOriginMaxHttpVersion = new cloudflare.ZoneSetting(
  resourceName('zone-origin-max-http-version'),
  { zoneId, settingId: 'origin_max_http_version', value: '2' },
  { import: `${zoneId}/origin_max_http_version`, protect: true },
)
export const zoneOriginH2MaxStreams = new cloudflare.ZoneSetting(
  resourceName('zone-origin-h2-max-streams'),
  { zoneId, settingId: 'origin_h2_max_streams', value: 100 },
  { import: `${zoneId}/origin_h2_max_streams`, protect: true },
)
export const zonePseudoIpv4 = new cloudflare.ZoneSetting(
  resourceName('zone-pseudo-ipv4'),
  { zoneId, settingId: 'pseudo_ipv4', value: 'off' },
  { import: `${zoneId}/pseudo_ipv4`, protect: true },
)
export const zoneRocketLoader = new cloudflare.ZoneSetting(
  resourceName('zone-rocket-loader'),
  { zoneId, settingId: 'rocket_loader', value: 'off' },
  { import: `${zoneId}/rocket_loader`, protect: true },
)
export const zoneSecurityHeader = new cloudflare.ZoneSetting(
  resourceName('zone-security-header'),
  {
    zoneId,
    settingId: 'security_header',
    value: {
      strict_transport_security: {
        enabled: false,
        max_age: 0,
        include_subdomains: false,
        preload: false,
        nosniff: false,
      },
    },
  },
  { import: `${zoneId}/security_header`, protect: true },
)
export const zoneSecurityLevel = new cloudflare.ZoneSetting(
  resourceName('zone-security-level'),
  { zoneId, settingId: 'security_level', value: 'medium' },
  { import: `${zoneId}/security_level`, protect: true },
)
export const zoneServerSideExclude = new cloudflare.ZoneSetting(
  resourceName('zone-server-side-exclude'),
  { zoneId, settingId: 'server_side_exclude', value: 'on' },
  { import: `${zoneId}/server_side_exclude`, protect: true },
)
export const zoneTls13 = new cloudflare.ZoneSetting(
  resourceName('zone-tls-1-3'),
  { zoneId, settingId: 'tls_1_3', value: 'zrt' },
  { import: `${zoneId}/tls_1_3`, protect: true },
)
export const zoneWaf = new cloudflare.ZoneSetting(
  resourceName('zone-waf'),
  { zoneId, settingId: 'waf', value: 'off' },
  { import: `${zoneId}/waf`, protect: true },
)
export const zoneWebsockets = new cloudflare.ZoneSetting(
  resourceName('zone-websockets'),
  { zoneId, settingId: 'websockets', value: 'on' },
  { import: `${zoneId}/websockets`, protect: true },
)
export const zoneDnssec = new cloudflare.ZoneDnssec(
  resourceName('zone-dnssec'),
  { zoneId, status: 'disabled' },
  { import: zoneId, protect: true },
)
// Own normalization only through this API, not the backing sanitize entrypoint ruleset.
export const zoneUrlNormalization = new cloudflare.UrlNormalizationSettings(
  resourceName('zone-url-normalization'),
  { zoneId, type: 'cloudflare', scope: 'both' },
  { import: zoneId, protect: true },
)
// Smart topology is editable, unlike the read-only Argo tiered_caching observation.
export const zoneSmartTieredCache = new cloudflare.TieredCache(
  resourceName('zone-smart-tiered-cache'),
  { zoneId, value: 'on' },
  { import: zoneId, protect: true },
)
export const zoneBotManagement = new cloudflare.BotManagement(
  resourceName('zone-bot-management'),
  {
    zoneId,
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
  { import: zoneId, protect: true },
)
export const zoneManagedTransforms = new cloudflare.ManagedTransforms(
  resourceName('zone-managed-transforms'),
  {
    zoneId,
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
  { import: zoneId, protect: true },
)
export const zoneUniversalSsl = new cloudflare.UniversalSslSetting(
  resourceName('zone-universal-ssl'),
  { zoneId, enabled: true },
  { import: zoneId, protect: true },
)
export const zoneAuthenticatedOriginPulls = new cloudflare.AuthenticatedOriginPullsSettings(
  resourceName('zone-authenticated-origin-pulls'),
  { zoneId, enabled: false },
  { import: zoneId, protect: true },
)
export const zoneAutoOriginTlsKex = new cloudflare.ZoneAutoOriginTlsKex(
  resourceName('zone-auto-origin-tls-kex'),
  { zoneId, enabled: true },
  { import: zoneId, protect: true },
)
export const zoneOriginTlsCompliance = new cloudflare.OriginTlsComplianceModes(
  resourceName('zone-origin-tls-compliance'),
  { zoneId, values: [] },
  { import: zoneId, protect: true },
)
export const zoneCtAlerting = new cloudflare.CtAlerting(
  resourceName('zone-ct-alerting'),
  { zoneId, enabled: true, emails: ['kaihatu.totto2727@gmail.com'] },
  { import: zoneId, protect: true },
)

import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'

// Native serviceTokenInactivity is optional, but its action and threshold are
// required non-null when supplied. Omit the disabled policy rather than invent
// an action/threshold or replace nulls with {}. Optional permits omission but is
// not proof of preservation: native Update calls state-aware MarshalForUpdate.
// ignoreChanges explicitly retains imported inactivity state on later updates.
// strict_service_token_auth is computed_optional and redacted in saved evidence.
// cache_device_posture, disable_end_user_app_creation and trusted_accounts have
// no native inputs. has_migrated_private_apps is server migration metadata.
export const zeroTrustOrganization = new cloudflare.ZeroTrustOrganization(
  config.resourceName('zero-trust-organization'),
  {
    accountId: config.accountID,
    authDomain: 'totto2727.cloudflareaccess.com',
    name: 'totto2727.cloudflareaccess.com',
    loginDesign: {},
    isUiReadOnly: false,
    allowAuthenticateViaWarp: false,
    warpAuthNonBrowser401: false,
    denyUnmatchedRequests: false,
    denyUnmatchedRequestsExemptedZoneNames: [],
  },
  {
    import: config.accountID,
    protect: true,
    ignoreChanges: ['serviceTokenInactivity', 'strictServiceTokenAuth'],
  },
)

// Preserve the active certificate binding without adopting its certificate lifecycle.
// Null Gateway blocks have no native null input and are intentionally not synthesized.
export const gatewaySettings = new cloudflare.ZeroTrustGatewaySettings(
  config.resourceName('gateway-settings'),
  {
    accountId: config.accountID,
    settings: {
      tlsDecrypt: { enabled: false },
      extendedEmailMatching: { enabled: false },
      certificate: { id: 'aab62902-08c8-4a06-aee7-fea2b805c45c' },
    },
  },
  { import: config.accountID, protect: true },
)

// The provider exposes neither dns64_enabled nor anonymized_logs_enabled as inputs.
// Allocated addresses and the DoH subdomain remain Cloudflare-owned outputs.
export const defaultDnsLocation = new cloudflare.ZeroTrustDnsLocation(
  config.resourceName('default-dns-location'),
  {
    accountId: config.accountID,
    name: 'Default Location',
    networks: [],
    clientDefault: true,
    ecsSupport: false,
    dnsDestinationIpsId: '0e4a32c6-6fb8-4858-9296-98f51631e8e6',
    maxTtl: { mode: 'inherit' },
  },
  { import: `${config.accountID}/bc7353169b28418ea3b00c598069cce3`, protect: true },
)

// Default policies and split tunnels are user-editable, not managed catalogs.
// always_include/always_exclude and gateway_unique_id are server-generated.
// Native 6.23.3 has no enable_netbt or enable_device_credential_authentication input.
export const defaultDeviceProfile = new cloudflare.ZeroTrustDeviceDefaultProfile(
  config.resourceName('default-device-profile'),
  {
    accountId: config.accountID,
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
  { import: config.accountID, protect: true },
)

export const defaultDeviceLocalDomainFallback = new cloudflare.ZeroTrustDeviceDefaultProfileLocalDomainFallback(
  config.resourceName('default-device-local-domain-fallback'),
  {
    accountId: config.accountID,
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
  { import: config.accountID, protect: true },
)

export const connectivitySettings = new cloudflare.ZeroTrustConnectivitySettings(
  config.resourceName('connectivity-settings'),
  {
    accountId: config.accountID,
    icmpProxyEnabled: false,
    offrampWarpEnabled: false,
  },
  { import: config.accountID, protect: true },
)

// An omitted public key preserves the observed disabled/null payload encryption key.
// The native input documents omission as unchanged for PATCH, disabled for PUT.
// customer_validation_timeout_ms is absent from the native schema.
export const dlpSettings = new cloudflare.ZeroTrustDlpSettings(
  config.resourceName('dlp-settings'),
  {
    accountId: config.accountID,
    aiContextAnalysis: false,
    ocr: false,
    payloadLogging: { maskingLevel: 'default' },
  },
  { import: config.accountID, protect: true },
)

// The installed plugin tags redirect_url as computed, despite the SDK exposing it.
// The provider rejects SCIM configuration for onetimepin identity providers.
// config omits only the generated callback, not an actual writable input.
export const oneTimePinIdentityProvider = new cloudflare.ZeroTrustAccessIdentityProvider(
  config.resourceName('one-time-pin-identity-provider'),
  {
    accountId: config.accountID,
    name: '',
    type: 'onetimepin',
    config: {},
  },
  { import: `accounts/${config.accountID}/5b7f588f-66e8-434e-bb36-a69a837a61ed`, protect: true },
)

// Native 6.23.3 has no importer, but Create calls DeviceSettingService.Update:
// PUT accounts/{account_id}/devices/settings, updating the existing singleton.
// The initial native write is intentional. The response-only managed marker
// (observed not_api_managed) has no native input and is not asserted unchanged.
export const deviceSettings = new cloudflare.ZeroTrustDeviceSettings(
  config.resourceName('device-settings'),
  {
    accountId: config.accountID,
    gatewayProxyEnabled: false,
    gatewayUdpProxyEnabled: false,
    rootCertificateInstallationEnabled: false,
    disableForTime: 0,
    useZtVirtualIp: false,
  },
  { protect: true },
)

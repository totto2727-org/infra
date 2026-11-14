import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'

// Native provider 6.23.3 Create calls SettingAccountService.Edit and SettingZoneService.Edit:
// PATCH /accounts/{account_id}/dns_settings and /zones/{zone_id}/dns_settings.
// These idempotently update existing singletons, not accounts or zones. Import is unsupported.
// Custom SOA writes are unavailable for this account/zone; Cloudflare owns the SOA defaults.
// Null internal_dns.reference_zone_id remains omitted rather than inventing a fallback zone.
export const accountDnsSettings = new cloudflare.AccountDnsSettings(
  config.resourceName('account-dns-settings'),
  {
    accountId: config.accountID,
    // enforce_dns_only is absent from the snapshot, not observed false.
    zoneDefaults: {
      flattenAllCnames: false,
      multiProvider: false,
      nameservers: { type: 'cloudflare.standard' },
      nsTtl: 86400,
      secondaryOverrides: false,
      zoneMode: 'standard',
    },
  },
  { protect: true },
)

export const zoneDnsSettings = new cloudflare.ZoneDnsSettings(
  config.resourceName('zone-dns-settings'),
  {
    zoneId: config.zoneID,
    flattenAllCnames: false,
    multiProvider: false,
    nameservers: { type: 'cloudflare.standard' },
    nsTtl: 86400,
    secondaryOverrides: false,
    zoneMode: 'standard',
  },
  { protect: true },
)

// Native Create calls SettingService.Update: PUT /zones/{zone_id}/schema_validation/settings.
// This replaces singleton settings, not schemas. Observed override is null, not "none".
// Omit the unsupported null input to retain the default of no override on this PUT.
export const schemaValidationSettings = new cloudflare.SchemaValidationSettings(
  config.resourceName('schema-validation-settings'),
  { zoneId: config.zoneID, validationDefaultMitigationAction: 'none' },
  { protect: true },
)

import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'

// Native provider 6.23.3 Create calls SettingAccountService.Edit and SettingZoneService.Edit:
// PATCH /accounts/{account_id}/dns_settings and /zones/{zone_id}/dns_settings.
// These idempotently update existing singletons, not accounts or zones. Import is unsupported.
// Null SOA mname and internal_dns.reference_zone_id remain omitted because native inputs
// accept strings, not null. Do not substitute an assigned nameserver or fallback zone.
export const accountDnsSettings = new cloudflare.AccountDnsSettings(
  config.resourceName('account-dns-settings'),
  {
    accountId: config.accountID,
    // enforce_dns_only is absent from the snapshot, not observed false.
    zoneDefaults: {
      flattenAllCnames: false,
      foundationDns: false,
      multiProvider: false,
      nameservers: { type: 'cloudflare.standard' },
      nsTtl: 86400,
      secondaryOverrides: false,
      soa: {
        expire: 604800,
        minTtl: 1800,
        refresh: 10000,
        retry: 2400,
        rname: 'dns.cloudflare.com',
        ttl: 3600,
      },
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
    foundationDns: false,
    multiProvider: false,
    nameservers: { type: 'cloudflare.standard' },
    nsTtl: 86400,
    secondaryOverrides: false,
    soa: {
      expire: 604800,
      minTtl: 1800,
      refresh: 10000,
      retry: 2400,
      rname: 'dns.cloudflare.com',
      ttl: 3600,
    },
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

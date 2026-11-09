import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'

// Pages-specific sites remain application-owned. The existing all-host/all-path
// auto-install rule cannot be imported by provider 6.23.3 and must not be recreated.
export const zoneWebAnalytics = new cloudflare.WebAnalyticsSite(
  config.resourceName('zone-web-analytics'),
  {
    accountId: config.accountID,
    autoInstall: true,
    enabled: true,
    lite: false,
    zoneTag: config.zoneID,
  },
  { import: `${config.accountID}/6b545023d8aa47f5864bf3b57e07b782`, protect: true },
)

import * as cloudflare from '@pulumi/cloudflare'

import { resourceName, zoneID } from './config.ts'

export const emailRoutingSettings = new cloudflare.EmailRoutingSettings(
  resourceName('email-routing-settings'),
  { zoneId: zoneID, supportSubaddress: true },
  { import: zoneID, protect: true },
)

// The rule-list entry cb815af6a9324a35a4dab7d8e69b19a9 is the same object
// returned by the catch-all endpoint, not a second EmailRoutingRule to adopt.
export const emailRoutingCatchAll = new cloudflare.EmailRoutingCatchAll(
  resourceName('email-routing-catch-all'),
  {
    zoneId: zoneID,
    name: '',
    enabled: false,
    matchers: [{ type: 'all' }],
    actions: [{ type: 'drop' }],
    source: 'api',
  },
  { import: zoneID, protect: true },
)

// Settings exposes enabled as an output, not a configurable boolean.
// EmailRoutingDns subdomain import and lifecycle semantics still need verification.
// MX/DKIM remain service-owned. SPF records have one owner in dns.ts.
// No separate subdomain rules/catch-all were evidenced.

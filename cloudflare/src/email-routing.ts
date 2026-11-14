import * as cloudflare from '@pulumi/cloudflare'

import { resourceName, zoneID } from './config.ts'

export const emailRoutingSettings = new cloudflare.EmailRoutingSettings(
  resourceName('email-routing-settings'),
  { zoneId: zoneID, supportSubaddress: true },
  { import: zoneID, protect: true },
)

// The zone-only importer adopts existing apex DNS without configuring it again.
// The API's optional name selects a subdomain, not the zone's apex.
export const emailRoutingApexDns = new cloudflare.EmailRoutingDns(
  resourceName('email-routing-apex-dns'),
  { zoneId: zoneID },
  { import: zoneID, protect: true, dependsOn: [emailRoutingSettings] },
)

// Native Create configures subdomain DNS, including SPF; the importer cannot select it.
export const emailRoutingSubdomainDns = new cloudflare.EmailRoutingDns(
  resourceName('email-routing-subdomain-dns'),
  { zoneId: zoneID, name: 'email.totto2727.dev', subdomain: 'email.totto2727.dev' },
  { protect: true, dependsOn: [emailRoutingApexDns] },
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

// Settings Create enables routing, and Delete disables it. Enabled is output-only.
// DNS controllers own MX/DKIM/SPF. Do not also declare these as DnsRecords.
// Subdomain reads use a deprecated response shape that the SDK does not model.
// No separate subdomain rules/catch-all were evidenced.

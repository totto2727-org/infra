import * as cloudflare from '@pulumi/cloudflare'

import { resourceName } from './config.ts'

// The rule-list entry cb815af6a9324a35a4dab7d8e69b19a9 is the same object
// returned by the catch-all endpoint, not a second EmailRoutingRule to adopt.
export const emailRoutingCatchAll = new cloudflare.EmailRoutingCatchAll(
  resourceName('email-routing-catch-all'),
  {
    zoneId: '502c8e36ae3b0e13da67e015e67c6b35',
    name: '',
    enabled: false,
    matchers: [{ type: 'all' }],
    actions: [{ type: 'drop' }],
    source: 'api',
  },
  { import: '502c8e36ae3b0e13da67e015e67c6b35', protect: true },
)

// Apex routing is enabled (ID 502c8e36ae3b0e13da67e015e67c6b35), as is
// email.totto2727.dev (ID 6f8e58caff874f5fac925f6bd02ef295). Neither is
// adopted here: provider 6.23.3 Settings has no enabled/subdomain inputs, and
// Dns has only a zone-ID import format, with no subdomain import selector.
// Do not use their enable/DNS-management lifecycle to approximate adoption.
// MX/DKIM remain service-owned. Only the independent SPF TXT records are
// managed in dns.ts. No separate subdomain rules/catch-all were evidenced.

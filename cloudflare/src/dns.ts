import * as cloudflare from '@pulumi/cloudflare'

import { resourceName, zoneID } from './config.ts'

export const dmarc = new cloudflare.DnsRecord(
  resourceName('dns-dmarc'),
  {
    zoneId: zoneID,
    name: '_dmarc.totto2727.dev',
    type: 'TXT',
    content: '"v=DMARC1; p=none; rua=mailto:360da409adee42c39d6c4a3f54fbdbb6@dmarc-reports.cloudflare.net"',
    ttl: 1,
    proxied: false,
    tags: [],
  },
  { import: `${zoneID}/ebd045e894a1bad55664cbce5afad9ca`, protect: true },
)

// Email Routing controllers own mail MX/DKIM/SPF. Worker DNS is generated.
// Pages CNAMEs stay application-owned. openshell is a separate deletion candidate.

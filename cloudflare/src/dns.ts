import * as cloudflare from '@pulumi/cloudflare'

import { resourceName } from './config.ts'

// The two SPF records have no auto-owner metadata. EmailRoutingDns is deliberately
// not registered, so it cannot also manage these records or rewrite mail-owned DNS.
export const sharedDnsRecords = [
  new cloudflare.DnsRecord(
    resourceName('dns-dmarc'),
    {
      zoneId: '502c8e36ae3b0e13da67e015e67c6b35',
      name: '_dmarc.totto2727.dev',
      type: 'TXT',
      content: '"v=DMARC1; p=none; rua=mailto:360da409adee42c39d6c4a3f54fbdbb6@dmarc-reports.cloudflare.net"',
      ttl: 1,
      proxied: false,
      tags: [],
    },
    { import: '502c8e36ae3b0e13da67e015e67c6b35/ebd045e894a1bad55664cbce5afad9ca', protect: true },
  ),
  new cloudflare.DnsRecord(
    resourceName('dns-apex-spf'),
    {
      zoneId: '502c8e36ae3b0e13da67e015e67c6b35',
      name: 'totto2727.dev',
      type: 'TXT',
      content: '"v=spf1 include:_spf.mx.cloudflare.net ~all"',
      ttl: 1,
      proxied: false,
      tags: [],
    },
    { import: '502c8e36ae3b0e13da67e015e67c6b35/6baf9f43d3313f0f599deb948aa62ba6', protect: true },
  ),
  new cloudflare.DnsRecord(
    resourceName('dns-email-spf'),
    {
      zoneId: '502c8e36ae3b0e13da67e015e67c6b35',
      name: 'email.totto2727.dev',
      type: 'TXT',
      content: '"v=spf1 include:_spf.mx.cloudflare.net ~all"',
      ttl: 1,
      proxied: false,
      tags: [],
    },
    { import: '502c8e36ae3b0e13da67e015e67c6b35/1cb69c2d6342fdb1bd566b1e5413fc8c', protect: true },
  ),
]

// Excluded: five read-only Worker AAAA records and seven read-only mail MX/DKIM
// records retain their service owner. The three Pages CNAMEs remain app-owned.
// openshell's Tunnel target is absent from the audited Tunnel inventory, so its
// CNAME must not be adopted until ownership and the dangling reference are resolved.

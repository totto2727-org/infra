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

export const apexSpf = new cloudflare.DnsRecord(
  resourceName('dns-apex-spf'),
  {
    zoneId: zoneID,
    name: 'totto2727.dev',
    type: 'TXT',
    content: '"v=spf1 include:_spf.mx.cloudflare.net ~all"',
    ttl: 1,
    proxied: false,
    tags: [],
  },
  { import: `${zoneID}/6baf9f43d3313f0f599deb948aa62ba6`, protect: true },
)

export const emailSpf = new cloudflare.DnsRecord(
  resourceName('dns-email-spf'),
  {
    zoneId: zoneID,
    name: 'email.totto2727.dev',
    type: 'TXT',
    content: '"v=spf1 include:_spf.mx.cloudflare.net ~all"',
    ttl: 1,
    proxied: false,
    tags: [],
  },
  { import: `${zoneID}/1cb69c2d6342fdb1bd566b1e5413fc8c`, protect: true },
)

// Generated Worker and Email Routing DNS stay with their controllers.
// Pages CNAMEs stay application-owned. openshell is a separate deletion candidate.

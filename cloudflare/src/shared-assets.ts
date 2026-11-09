import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'

export const zone = new cloudflare.Zone(
  config.resourceName('zone'),
  {
    account: { id: config.accountID },
    name: 'totto2727.dev',
    paused: false,
    type: 'full',
    vanityNameServers: [],
  },
  { import: config.zoneID, protect: true },
)

export const publicImageVariant = new cloudflare.ImageVariant(
  config.resourceName('image-variant-public'),
  {
    accountId: config.accountID,
    imageVariantId: 'public',
    neverRequireSignedUrls: false,
    options: { fit: 'scale-down', width: 1366, height: 768, metadata: 'none' },
  },
  { import: `${config.accountID}/public`, protect: true },
)

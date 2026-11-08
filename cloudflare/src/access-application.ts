import * as cloudflare from '@pulumi/cloudflare'

import { allowPasskeys } from './access-policy.ts'
import * as config from './config.ts'
import { passkeys } from './identity-provider.ts'

const tags = Object.entries(config.accessApplicationTags).map(
  ([key, name]) =>
    new cloudflare.ZeroTrustAccessTag(
      config.resourceName(`access-tag-${key}`),
      { accountId: config.accountID, name },
      { protect: true },
    ),
)

const createApplication = (name: string, domain: string) =>
  new cloudflare.ZeroTrustAccessApplication(
    config.resourceName(name),
    {
      accountId: config.accountID,
      allowedIdps: [passkeys.id],
      appLauncherVisible: true,
      autoRedirectToIdentity: false,
      destinations: [{ type: 'public', uri: domain }],
      domain,
      name: config.resourceName(name),
      policies: [{ id: allowPasskeys.id, precedence: 1 }],
      sessionDuration: '24h',
      tags: tags.map((tag) => tag.name),
      type: 'self_hosted',
    },
    { protect: true },
  )

export const projektor = createApplication('projektor', 'projektor.totto2727.dev')
export const cloudflareOs = createApplication('cloudflare-os', 'cloudflare.totto2727.dev')

export const projektorAccessAudience = projektor.aud
export const projektorAccessDomain = projektor.domain
export const cloudflareOsAccessAudience = cloudflareOs.aud
export const cloudflareOsAccessDomain = cloudflareOs.domain

import * as cloudflare from '@pulumi/cloudflare'

import { allowPasskeys } from './access-policy.ts'
import * as config from './config.ts'
import { passkeys } from './identity-provider.ts'

export const environmentTag = new cloudflare.ZeroTrustAccessTag(
  config.resourceName('access-tag-environment'),
  { accountId: config.accountID, name: config.accessApplicationTags.environment },
  { protect: true },
)
export const managedByTag = new cloudflare.ZeroTrustAccessTag(
  config.resourceName('access-tag-managedBy'),
  { accountId: config.accountID, name: config.accessApplicationTags.managedBy },
  { protect: true },
)
export const pulumiProjectTag = new cloudflare.ZeroTrustAccessTag(
  config.resourceName('access-tag-pulumiProject'),
  { accountId: config.accountID, name: config.accessApplicationTags.pulumiProject },
  { protect: true },
)
export const pulumiStackTag = new cloudflare.ZeroTrustAccessTag(
  config.resourceName('access-tag-pulumiStack'),
  { accountId: config.accountID, name: config.accessApplicationTags.pulumiStack },
  { protect: true },
)
export const repositoryTag = new cloudflare.ZeroTrustAccessTag(
  config.resourceName('access-tag-repository'),
  { accountId: config.accountID, name: config.accessApplicationTags.repository },
  { protect: true },
)

export const projektor = new cloudflare.ZeroTrustAccessApplication(
  config.resourceName('projektor'),
  {
    accountId: config.accountID,
    allowedIdps: [passkeys.id],
    appLauncherVisible: true,
    autoRedirectToIdentity: false,
    destinations: [{ type: 'public', uri: 'projektor.totto2727.dev' }],
    domain: 'projektor.totto2727.dev',
    name: config.resourceName('projektor'),
    policies: [{ id: allowPasskeys.id, precedence: 1 }],
    sessionDuration: '24h',
    tags: [environmentTag.name, managedByTag.name, pulumiProjectTag.name, pulumiStackTag.name, repositoryTag.name],
    type: 'self_hosted',
  },
  { protect: true },
)
export const cloudflareOs = new cloudflare.ZeroTrustAccessApplication(
  config.resourceName('cloudflare-os'),
  {
    accountId: config.accountID,
    allowedIdps: [passkeys.id],
    appLauncherVisible: true,
    autoRedirectToIdentity: false,
    destinations: [{ type: 'public', uri: 'cloudflare.totto2727.dev' }],
    domain: 'cloudflare.totto2727.dev',
    name: config.resourceName('cloudflare-os'),
    policies: [{ id: allowPasskeys.id, precedence: 1 }],
    sessionDuration: '24h',
    tags: [environmentTag.name, managedByTag.name, pulumiProjectTag.name, pulumiStackTag.name, repositoryTag.name],
    type: 'self_hosted',
  },
  { protect: true },
)

export const projektorAccessAudience = projektor.aud
export const projektorAccessDomain = projektor.domain
export const cloudflareOsAccessAudience = cloudflareOs.aud
export const cloudflareOsAccessDomain = cloudflareOs.domain

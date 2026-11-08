import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'
import { passkeys } from './identity-provider.ts'

export const passkeyUsers = new cloudflare.ZeroTrustAccessGroup(
  config.resourceName('passkey-users-access-group'),
  {
    accountId: config.accountID,
    includes: [{ email: { email: 'kaihatu.totto2727@gmail.com' } }, { email: { email: 'hayato.2000.0727@gmail.com' } }],
    name: config.resourceName('passkey-users'),
    requires: [{ loginMethod: { id: passkeys.id } }],
  },
  { protect: true },
)

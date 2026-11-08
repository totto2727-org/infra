import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'

export const passkeys = new cloudflare.ZeroTrustAccessIdentityProvider(
  config.resourceName('passkeys-identity-provider'),
  {
    accountId: config.accountID,
    config: { loginPageAutoPrompt: false },
    name: config.resourceName('passkeys'),
    type: 'passkeys',
  },
  { protect: true },
)

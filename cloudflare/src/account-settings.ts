import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'

export const account = new cloudflare.Account(
  config.resourceName('account-settings'),
  {
    name: "Kaihatu.totto2727@gmail.com's Account",
    settings: { enforceTwofactor: true },
  },
  { import: config.accountID, protect: true },
)

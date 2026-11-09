import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'

// Enable only log redaction after current-settings adoption.
export const gatewayLogging = new cloudflare.ZeroTrustGatewayLogging(
  config.resourceName('gateway-logging'),
  {
    accountId: config.accountID,
    redactPii: true,
    settingsByRuleType: {
      dns: { logAll: true, logBlocks: false },
      http: { logAll: true, logBlocks: false },
      l4: { logAll: true, logBlocks: false },
    },
  },
  { import: config.accountID, protect: true },
)

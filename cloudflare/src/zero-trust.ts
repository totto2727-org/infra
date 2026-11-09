import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'

// Adopt only the explicit logging policy. Organization fields are redacted in the
// evidence, and Gateway certificate ownership is not established for adoption.
export const gatewayLogging = new cloudflare.ZeroTrustGatewayLogging(
  config.resourceName('gateway-logging'),
  {
    accountId: config.accountID,
    redactPii: false,
    settingsByRuleType: {
      dns: { logAll: true, logBlocks: false },
      http: { logAll: true, logBlocks: false },
      l4: { logAll: true, logBlocks: false },
    },
  },
  { import: config.accountID, protect: true },
)

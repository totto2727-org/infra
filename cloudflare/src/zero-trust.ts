import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'

// Adopt only the explicit logging policy. Organization inactivity enforcement is
// disabled with null action/threshold, but native inputs require both non-null.
// Organization trust is not writable here. Gateway certificate ownership is unknown.
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

import * as cloudflare from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'

import * as config from './config.ts'

export const aiGateway = new cloudflare.AiGateway(
  config.resourceName('ai-gateway'),
  {
    accountId: config.accountID,
    aiGatewayId: config.resourceName('ai-gateway'),
    authentication: true,
    cacheInvalidateOnUpdate: true,
    cacheTtl: 0,
    collectLogs: false,
    rateLimitingInterval: 0,
    rateLimitingLimit: 0,
  },
  { protect: true },
)

export const { aiGatewayId } = aiGateway
export const aiGatewayBaseUrl = pulumi.interpolate`https://gateway.ai.cloudflare.com/v1/${aiGateway.accountId}/${aiGateway.aiGatewayId}`

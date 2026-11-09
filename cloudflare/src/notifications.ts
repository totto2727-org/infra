import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'

export const webAnalytics = new cloudflare.NotificationPolicy(
  config.resourceName('web-analytics-notification'),
  {
    accountId: config.accountID,
    alertType: 'web_analytics_metrics_update',
    description: 'Default Web Analytics Metrics Update',
    enabled: true,
    mechanisms: { emails: [{ id: 'kaihatu.totto2727@gmail.com' }] },
    name: 'Default Web Analytics Metrics Update',
  },
  { import: `${config.accountID}/81dcb2b1c9a74fd68a4666bf187f8eef`, protect: true },
)

// Keep budget policy 64d4e770f1c34faea161a193494f209a unmanaged: provider 6.23.3
// cannot represent its total_spend_dollars: ["10"] filter. Importing without it
// would not preserve the existing USD 10 threshold.

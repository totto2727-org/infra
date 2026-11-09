import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'

// Preserve the accepted membership and both assignment representations from the audit.
// The built-in permission/resource groups are referenced, not independently managed.
export const accountMember = new cloudflare.AccountMember(
  config.resourceName('account-member'),
  {
    accountId: config.accountID,
    email: 'kaihatu.totto2727@gmail.com',
    status: 'accepted',
    roles: ['33666b9c79b9a5273fc7344ff42f953d'],
    policies: [
      {
        access: 'allow',
        permissionGroups: [{ id: '8e23b19e4e0d44c29d239c5688ba8cbb' }],
        resourceGroups: [{ id: 'f4b2044943cc427693c60781a4c99ece' }],
      },
    ],
  },
  { import: `${config.accountID}/8cea2300211fbc6fdd1600cf4e60a27d`, protect: true },
)

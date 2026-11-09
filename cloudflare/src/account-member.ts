import * as cloudflare from '@pulumi/cloudflare'

import * as config from './config.ts'
import { iamCatalogLimit, namedIamId } from './iam-reference.ts'

const administratorName = 'Super Administrator - All Privileges'
const accountScopeName = `com.cloudflare.api.account.${config.accountID}`

const administratorRoleId = cloudflare
  .getAccountRolesOutput({ accountId: config.accountID, maxItems: iamCatalogLimit })
  .apply(({ results }) => namedIamId(results, administratorName))

const administratorPermissionGroupId = cloudflare
  .getAccountPermissionGroupsOutput({
    accountId: config.accountID,
    name: administratorName,
    maxItems: iamCatalogLimit,
  })
  .apply(({ results }) => namedIamId(results, administratorName))

const accountResourceGroupId = cloudflare
  .getResourceGroupsOutput({ accountId: config.accountID, name: accountScopeName, maxItems: iamCatalogLimit })
  .apply(({ results }) => namedIamId(results, accountScopeName))

// Built-in objects remain Cloudflare-owned; only their membership assignment is managed.
export const accountMember = new cloudflare.AccountMember(
  config.resourceName('account-member'),
  {
    accountId: config.accountID,
    email: 'kaihatu.totto2727@gmail.com',
    status: 'accepted',
    roles: [administratorRoleId],
    policies: [
      {
        access: 'allow',
        permissionGroups: [{ id: administratorPermissionGroupId }],
        resourceGroups: [{ id: accountResourceGroupId }],
      },
    ],
  },
  { import: `${config.accountID}/8cea2300211fbc6fdd1600cf4e60a27d`, protect: true },
)

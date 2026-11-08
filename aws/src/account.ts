import * as aws from '@pulumi/aws'

import * as config from './config.ts'
import * as group from './group.ts'
import * as identityStore from './identify-store.ts'
import * as permissionSet from './permission-set.ts'

export const totto2727 = new aws.organizations.Account(
  'totto2727-account',
  {
    closeOnDeletion: false,
    createGovcloud: false,
    email: 'kaihatu.totto2727@gmail.com',
    iamUserAccessToBilling: 'ALLOW',
    name: 'totto2727',
    parentId: 'r-n63z',
  },
  {
    protect: true,
  },
)

export const totto2727AdminGroupAdministratorPermissionSet = new aws.ssoadmin.AccountAssignment(
  config.resourceName('admin-administrator-permission-set'),
  {
    instanceArn: identityStore.arn,
    permissionSetArn: permissionSet.administratorAccess.arn,
    principalId: group.admin.groupId,
    principalType: 'GROUP',
    region: identityStore.region,
    targetId: totto2727.id,
    targetType: 'AWS_ACCOUNT',
  },
  config.protectedResourceOptions('admin-administrator-permission-set'),
)

export const totto2727AdminGroupBillingPermissionSet = new aws.ssoadmin.AccountAssignment(
  config.resourceName('admin-billing-permission-set'),
  {
    instanceArn: identityStore.arn,
    permissionSetArn: permissionSet.billing.arn,
    principalId: group.admin.groupId,
    principalType: 'GROUP',
    region: identityStore.region,
    targetId: totto2727.id,
    targetType: 'AWS_ACCOUNT',
  },
  config.protectedResourceOptions('admin-billing-permission-set'),
)

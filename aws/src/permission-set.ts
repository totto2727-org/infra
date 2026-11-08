import * as aws from '@pulumi/aws'

import * as config from './config.ts'
import * as identityStore from './identify-store.ts'

export const billing = new aws.ssoadmin.PermissionSet(
  config.resourceName('billing'),
  {
    instanceArn: identityStore.arn,
    name: config.resourceName('billing'),
    region: identityStore.region,
  },
  config.protectedResourceOptions('billing'),
)

export const billingPolicy = new aws.ssoadmin.ManagedPolicyAttachment(
  config.resourceName('billing-policy'),
  {
    instanceArn: identityStore.arn,
    managedPolicyArn: 'arn:aws:iam::aws:policy/job-function/Billing',
    permissionSetArn: billing.arn,
    region: identityStore.region,
  },
  config.protectedResourceOptions('billing-policy'),
)

export const administratorAccess = new aws.ssoadmin.PermissionSet(
  config.resourceName('administrator-access'),
  {
    instanceArn: identityStore.arn,
    name: config.resourceName('administrator-access'),
    region: identityStore.region,
  },
  config.protectedResourceOptions('administrator-access'),
)

export const administratorAccessPolicy = new aws.ssoadmin.ManagedPolicyAttachment(
  config.resourceName('administrator-access-policy'),
  {
    instanceArn: identityStore.arn,
    managedPolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
    permissionSetArn: administratorAccess.arn,
    region: identityStore.region,
  },
  config.protectedResourceOptions('administrator-access-policy'),
)

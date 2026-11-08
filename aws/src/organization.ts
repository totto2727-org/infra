import * as aws from '@pulumi/aws'

import * as config from './config.ts'

export const feature = new aws.iam.OrganizationsFeatures(
  config.resourceName('organization-feature'),
  {
    enabledFeatures: ['RootSessions', 'RootCredentialsManagement'],
  },
  config.protectedResourceOptions('organization-feature'),
)

export const passwordPolicy = new aws.iam.AccountPasswordPolicy(
  config.resourceName('password-policy'),
  {
    allowUsersToChangePassword: false,
    minimumPasswordLength: 8,
    passwordReusePrevention: 5,
    requireLowercaseCharacters: true,
    requireNumbers: true,
    requireSymbols: true,
    requireUppercaseCharacters: true,
  },
  config.protectedResourceOptions('password-policy'),
)

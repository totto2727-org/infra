import * as aws from '@pulumi/aws'

import * as config from './config.ts'
import * as identifyStore from './identify-store.ts'

export const totto2727 = new aws.identitystore.User(
  config.resourceName('totto2727'),
  {
    displayName: '土田 快斗',
    emails: {
      primary: true,
      type: 'work',
      value: 'kaihatu.totto2727@gmail.com',
    },
    identityStoreId: identifyStore.id,
    name: {
      familyName: '土田',
      givenName: '快斗',
    },
    region: identifyStore.region,
    userName: 'totto2727',
  },
  config.protectedResourceOptions('totto2727'),
)

export const test = new aws.identitystore.User(
  config.resourceName('test'),
  {
    displayName: 'test',
    emails: {
      primary: true,
      type: 'work',
      value: 'hayato.2000.0727@gmail.com',
    },
    identityStoreId: identifyStore.id,
    name: {
      familyName: 'test',
      givenName: 'test',
    },
    region: identifyStore.region,
    userName: 'test',
  },
  config.protectedResourceOptions('test'),
)

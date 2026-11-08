import * as aws from '@pulumi/aws'

import * as config from './config.ts'
import * as identifyStore from './identify-store.ts'

const createGroup = (name: string, displayName: string) =>
  new aws.identitystore.Group(
    config.resourceName(name),
    {
      displayName: config.resourceName(displayName),
      identityStoreId: identifyStore.id,
      region: identifyStore.region,
    },
    config.protectedResourceOptions(name),
  )

export const admin = createGroup('admin', 'admin')

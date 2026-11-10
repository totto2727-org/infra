import * as pulumi from '@pulumi/pulumi'

import { createOrganization } from './organization.ts'
import { dotfilesProvider } from './totto2727-dotfiles-provider.ts'
import { orgProvider } from './totto2727-org-provider.ts'

const config = new pulumi.Config('githubOwners')

export const totto2727Org = createOrganization({
  billingEmail: config.requireSecret('totto2727OrgBillingEmail'),
  owner: 'totto2727-org',
  provider: orgProvider,
})

export const totto2727Dotfiles = createOrganization({
  billingEmail: config.requireSecret('totto2727DotfilesBillingEmail'),
  owner: 'totto2727-dotfiles',
  provider: dotfilesProvider,
})

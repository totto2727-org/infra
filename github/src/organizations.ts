import * as pulumi from '@pulumi/pulumi'

import { createOrganization } from './organization.ts'
import { dotfilesProvider } from './totto2727-dotfiles-provider.ts'
import * as dotfiles from './totto2727-dotfiles.ts'
import { orgProvider } from './totto2727-org-provider.ts'
import * as org from './totto2727-org.ts'

const config = new pulumi.Config('githubOwners')

export const totto2727Org = createOrganization({
  billingEmail: config.requireSecret('totto2727OrgBillingEmail'),
  members: [
    { username: 'totto2727', role: 'maintainer' },
    { username: 'totto2727-ai', role: 'member' },
  ],
  owner: 'totto2727-org',
  provider: orgProvider,
  repositories: Object.fromEntries(Object.entries(org).map(([name, { repository }]) => [name, repository])),
})

export const totto2727Dotfiles = createOrganization({
  billingEmail: config.requireSecret('totto2727DotfilesBillingEmail'),
  members: [{ username: 'totto2727', role: 'maintainer' }],
  owner: 'totto2727-dotfiles',
  provider: dotfilesProvider,
  repositories: Object.fromEntries(Object.entries(dotfiles).map(([name, { repository }]) => [name, repository])),
})

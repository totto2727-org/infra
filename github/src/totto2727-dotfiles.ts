import * as pulumi from '@pulumi/pulumi'

import { createRepositoryFactory } from './repository.ts'

const createRepository = createRepositoryFactory(
  'totto2727-dotfiles',
  new pulumi.Config('githubOwners').requireSecret('totto2727DotfilesToken'),
)

export const nix = createRepository('nix', {
  description: 'Shared Nix development environments and GitHub Actions',
})

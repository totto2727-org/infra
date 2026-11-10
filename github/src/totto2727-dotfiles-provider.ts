import * as github from '@pulumi/github'
import * as pulumi from '@pulumi/pulumi'

export const dotfilesProvider = new github.Provider('totto2727-dotfiles', {
  owner: 'totto2727-dotfiles',
  token: new pulumi.Config('githubOwners').requireSecret('totto2727DotfilesToken'),
})

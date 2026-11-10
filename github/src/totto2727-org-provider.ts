import * as github from '@pulumi/github'
import * as pulumi from '@pulumi/pulumi'

export const orgProvider = new github.Provider('totto2727-org', {
  owner: 'totto2727-org',
  token: new pulumi.Config('githubOwners').requireSecret('totto2727OrgToken'),
})

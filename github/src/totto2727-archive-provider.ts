import * as github from '@pulumi/github'
import * as pulumi from '@pulumi/pulumi'

export const archiveProvider = new github.Provider('totto2727-archive', {
  owner: 'totto2727-archive',
  token: new pulumi.Config('githubOwners').requireSecret('totto2727ArchiveToken'),
})

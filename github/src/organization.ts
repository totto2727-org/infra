import * as github from '@pulumi/github'
import type * as pulumi from '@pulumi/pulumi'

export const organizationSettings = {
  advancedSecurityEnabledForNewRepositories: false,
  defaultRepositoryPermission: 'write',
  dependabotAlertsEnabledForNewRepositories: true,
  dependabotSecurityUpdatesEnabledForNewRepositories: true,
  dependencyGraphEnabledForNewRepositories: true,
  membersCanCreateInternalRepositories: false,
  membersCanCreatePages: false,
  membersCanCreatePrivatePages: false,
  membersCanCreatePrivateRepositories: true,
  membersCanCreatePublicPages: false,
  membersCanCreatePublicRepositories: true,
  membersCanCreateRepositories: true,
  membersCanForkPrivateRepositories: false,
  secretScanningEnabledForNewRepositories: true,
  secretScanningPushProtectionEnabledForNewRepositories: true,
  webCommitSignoffRequired: true,
} satisfies Omit<github.OrganizationSettingsArgs, 'billingEmail'>

export const createOrganization = ({
  owner,
  provider,
  billingEmail,
}: {
  owner: 'totto2727-org' | 'totto2727-dotfiles' | 'totto2727-archive'
  provider: github.Provider
  billingEmail: pulumi.Input<string>
}) => {
  const options = { protect: true, provider, retainOnDelete: true }
  const settings = new github.OrganizationSettings(
    `organization-${owner}`,
    { ...organizationSettings, billingEmail },
    {
      ...options,
      ignoreChanges: [
        'name',
        'description',
        'company',
        'blog',
        'email',
        'location',
        'twitterUsername',
        'hasOrganizationProjects',
        'hasRepositoryProjects',
      ],
    },
  )
  const workflowPermissions = new github.ActionsOrganizationWorkflowPermissions(
    `workflow-permissions-${owner}`,
    {
      canApprovePullRequestReviews: false,
      defaultWorkflowPermissions: 'read',
      organizationSlug: owner,
    },
    options,
  )
  return { settings, workflowPermissions }
}

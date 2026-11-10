import * as github from '@pulumi/github'
import type * as pulumi from '@pulumi/pulumi'

export const organizationSettings = {
  advancedSecurityEnabledForNewRepositories: false,
  defaultRepositoryPermission: 'none',
  dependabotAlertsEnabledForNewRepositories: true,
  dependabotSecurityUpdatesEnabledForNewRepositories: true,
  dependencyGraphEnabledForNewRepositories: true,
  membersCanCreateInternalRepositories: false,
  membersCanCreatePages: false,
  membersCanCreatePrivatePages: false,
  membersCanCreatePrivateRepositories: false,
  membersCanCreatePublicPages: false,
  membersCanCreatePublicRepositories: false,
  membersCanCreateRepositories: false,
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
  owner: 'totto2727-org' | 'totto2727-dotfiles'
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

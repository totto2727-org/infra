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
  members,
  repositories,
}: {
  owner: 'totto2727-org' | 'totto2727-dotfiles'
  provider: github.Provider
  billingEmail: pulumi.Input<string>
  members: github.types.input.TeamMembersMember[]
  repositories: Record<string, github.Repository>
}) => {
  const options = { protect: true, provider, retainOnDelete: true }
  const team = new github.Team(
    `maintainers-${owner}`,
    {
      description: 'Explicit write access to repositories managed by this stack. No organization administration.',
      name: 'maintainers',
      notificationSetting: 'notificationsEnabled',
      privacy: 'secret',
    },
    options,
  )
  const teamMembers = new github.TeamMembers(`maintainers-members-${owner}`, { members, teamSlug: team.slug }, options)
  const teamRepositories = Object.entries(repositories).map(
    ([name, repository]) =>
      new github.TeamRepository(
        `maintainers-${owner}-${name}`,
        { permission: 'push', repository: repository.name, teamId: team.id },
        { ...options, dependsOn: [teamMembers] },
      ),
  )
  const settings = new github.OrganizationSettings(
    `organization-${owner}`,
    { ...organizationSettings, billingEmail },
    {
      ...options,
      dependsOn: [teamMembers, ...teamRepositories],
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
  return { settings, team, teamMembers, teamRepositories, workflowPermissions }
}

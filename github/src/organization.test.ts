import * as github from '@pulumi/github'
import * as pulumi from '@pulumi/pulumi'
import { expect, test } from 'vite-plus/test'

import { createOrganization, organizationSettings } from './organization.ts'

test('unifies organization policy, preserves owner isolation, and grants only explicit repository write access', async () => {
  const resources: pulumi.runtime.MockResourceArgs[] = []
  await pulumi.runtime.setMocks(
    {
      call: (args) => {
        throw new Error(`Unexpected provider invocation: ${args.token}`)
      },
      newResource: (args) => {
        resources.push(args)
        // oxlint-disable-next-line typescript/no-unsafe-assignment -- Pulumi mock inputs must be echoed as resource state.
        return { id: `id-${args.name}`, state: { ...args.inputs, slug: 'maintainers' } }
      },
    },
    'github',
    'production',
  )
  const organizations = (['totto2727-org', 'totto2727-dotfiles'] as const).map((owner) => {
    const provider = new github.Provider(owner, { owner, token: pulumi.secret(`test-${owner}-token`) })
    const repository = new github.Repository(`repository-${owner}-shared-name`, { name: 'shared-name' }, { provider })
    return createOrganization({
      billingEmail: pulumi.secret(`billing-${owner}@example.invalid`),
      members: [{ username: 'totto2727', role: 'maintainer' }],
      owner,
      provider,
      repositories: { shared: repository },
    })
  })
  const { promise, resolve } = Promise.withResolvers<boolean>()
  pulumi
    .all(
      organizations.flatMap(({ settings, team, teamMembers, teamRepositories, workflowPermissions }) => [
        settings.id,
        team.id,
        teamMembers.id,
        workflowPermissions.id,
        ...teamRepositories.map(({ id }) => id),
      ]),
    )
    .apply(() => resolve(true))
  await promise

  expect(new Set(resources.map(({ name }) => name)).size).toBe(resources.length)
  for (const owner of ['totto2727-org', 'totto2727-dotfiles']) {
    expect(resources.find(({ name }) => name === `organization-${owner}`)?.inputs).toMatchObject({
      ...organizationSettings,
      billingEmail: {
        [pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
        value: `billing-${owner}@example.invalid`,
      },
    })
    expect(resources.find(({ name }) => name === `maintainers-${owner}`)?.inputs).toMatchObject({
      name: 'maintainers',
      privacy: 'secret',
    })
    expect(resources.find(({ name }) => name === `maintainers-members-${owner}`)?.inputs).toMatchObject({
      teamSlug: 'maintainers',
      members: [{ username: 'totto2727', role: 'maintainer' }],
    })
    expect(resources.find(({ name }) => name === `maintainers-${owner}-shared`)?.inputs).toMatchObject({
      permission: 'push',
      repository: 'shared-name',
      teamId: `id-maintainers-${owner}`,
    })
    expect(resources.find(({ name }) => name === `workflow-permissions-${owner}`)?.inputs).toMatchObject({
      canApprovePullRequestReviews: false,
      defaultWorkflowPermissions: 'read',
      organizationSlug: owner,
    })
    for (const resource of resources.filter(
      ({ name, type }) => name.includes(owner) && type !== 'pulumi:providers:github',
    )) {
      expect(resource.provider).toContain(`pulumi:providers:github::${owner}::id-${owner}`)
    }
    const settings = resources.find(({ name }) => name === `organization-${owner}`)?.inputs
    for (const field of [
      'name',
      'description',
      'company',
      'blog',
      'email',
      'location',
      'twitterUsername',
      'hasOrganizationProjects',
      'hasRepositoryProjects',
    ]) {
      expect(settings).not.toHaveProperty(field)
    }
  }
  expect(resources.some(({ name }) => name.includes('archive'))).toBe(false)
  expect(resources.filter(({ type }) => type === 'github:index/membership:Membership')).toHaveLength(0)
})

test('uses least privilege and free security defaults without enabling paid Advanced Security', () => {
  expect(organizationSettings).toEqual({
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
  })
})

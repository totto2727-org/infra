import * as pulumi from '@pulumi/pulumi'
import { expect, test } from 'vite-plus/test'

test('loads three organizations and explicit memberships without managing archive repositories or teams', async () => {
  const resources: pulumi.runtime.MockResourceArgs[] = []
  await pulumi.runtime.setMocks(
    {
      call: (args) => {
        throw new Error(`Unexpected provider invocation: ${args.token}`)
      },
      newResource: (args) => {
        resources.push(args)
        // oxlint-disable-next-line typescript/no-unsafe-assignment -- Pulumi mock inputs must be echoed as resource state.
        return { id: `id-${args.name}`, state: args.inputs }
      },
    },
    'github',
    'production',
  )
  const config = {
    'githubOwners:totto2727OrgToken': 'test-org-token',
    'githubOwners:totto2727DotfilesToken': 'test-dotfiles-token',
    'githubOwners:totto2727ArchiveToken': 'test-archive-token',
    'githubOwners:totto2727OrgBillingEmail': 'org@example.invalid',
    'githubOwners:totto2727DotfilesBillingEmail': 'dotfiles@example.invalid',
    'githubOwners:totto2727ArchiveBillingEmail': 'archive@example.invalid',
  }
  pulumi.runtime.setAllConfig(config, Object.keys(config))
  const stack = await import('../index.ts')
  const organizations = await import('./organizations.ts')
  const memberships = await import('./memberships.ts')
  const { promise, resolve } = Promise.withResolvers<string[]>()
  pulumi
    .all([
      stack.totto2727OrgId,
      stack.totto2727DotfilesId,
      stack.totto2727ArchiveId,
      ...stack.rulesetIds,
      ...stack.vulnerabilityAlertIds,
      ...Object.values(organizations).map(({ workflowPermissions }) => workflowPermissions.id),
      ...Object.values(memberships).map(({ id }) => id),
    ])
    .apply((ids) => resolve(ids))
  const ids = await promise
  expect(ids.slice(0, 3)).toEqual([
    'id-organization-totto2727-org',
    'id-organization-totto2727-dotfiles',
    'id-organization-totto2727-archive',
  ])
  expect(stack).not.toHaveProperty('organizationIds')

  const providers = resources.filter(({ type }) => type === 'pulumi:providers:github')
  expect(providers.map(({ name }) => name).toSorted()).toEqual([
    'totto2727-archive',
    'totto2727-dotfiles',
    'totto2727-org',
  ])
  for (const owner of ['totto2727-org', 'totto2727-dotfiles', 'totto2727-archive']) {
    for (const resource of resources.filter(
      ({ name, type }) => name.includes(owner) && type !== 'pulumi:providers:github',
    )) {
      expect(resource.provider).toContain(`pulumi:providers:github::${owner}::id-${owner}`)
    }
  }
  const repositories = resources.filter(({ type }) => type === 'github:index/repository:Repository')
  expect(repositories).toHaveLength(38)
  expect(resources.filter(({ type }) => type === 'github:index/team:Team')).toHaveLength(0)
  expect(resources.filter(({ type }) => type === 'github:index/teamMembers:TeamMembers')).toHaveLength(0)
  expect(resources.filter(({ type }) => type === 'github:index/teamRepository:TeamRepository')).toHaveLength(0)
  expect(
    resources
      .filter(({ type }) => type === 'github:index/membership:Membership')
      .map(({ name, inputs }) => ({ name, username: inputs['username'], role: inputs['role'] }))
      .toSorted((a, b) => a.name.localeCompare(b.name)),
  ).toEqual([
    { name: 'membership-totto2727-archive-totto2727', username: 'totto2727', role: 'admin' },
    { name: 'membership-totto2727-archive-totto2727-ai', username: 'totto2727-ai', role: 'member' },
    { name: 'membership-totto2727-dotfiles-totto2727', username: 'totto2727', role: 'admin' },
    { name: 'membership-totto2727-dotfiles-totto2727-ai', username: 'totto2727-ai', role: 'member' },
    { name: 'membership-totto2727-org-totto2727', username: 'totto2727', role: 'admin' },
    { name: 'membership-totto2727-org-totto2727-ai', username: 'totto2727-ai', role: 'member' },
  ])
  for (const repository of repositories) {
    expect(repository.name).toBe(
      `repository-${repository.inputs['name'] === 'nix' ? 'totto2727-dotfiles' : 'totto2727-org'}-${repository.inputs['name']}`,
    )
  }
  expect(resources.filter(({ type }) => type === 'github:index/repositoryRuleset:RepositoryRuleset')).toHaveLength(38)
  expect(
    resources.filter(({ type }) => type === 'github:index/repositoryVulnerabilityAlerts:RepositoryVulnerabilityAlerts'),
  ).toHaveLength(38)
  expect(new Set(resources.map(({ name }) => name)).size).toBe(resources.length)
  expect(repositories.some(({ name }) => name.includes('archive'))).toBe(false)
  expect(
    resources.filter(({ type }) => type === 'github:index/organizationSettings:OrganizationSettings'),
  ).toHaveLength(3)
})

import * as pulumi from '@pulumi/pulumi'
import { expect, test } from 'vite-plus/test'

test('loads both organizations and all repositories without creating teams or changing access grants', async () => {
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
    'githubOwners:totto2727OrgBillingEmail': 'org@example.invalid',
    'githubOwners:totto2727DotfilesBillingEmail': 'dotfiles@example.invalid',
  }
  pulumi.runtime.setAllConfig(config, Object.keys(config))
  const stack = await import('../index.ts')
  const organizations = await import('./organizations.ts')
  const { promise, resolve } = Promise.withResolvers<string[]>()
  pulumi
    .all([
      stack.totto2727OrgId,
      stack.totto2727DotfilesId,
      ...stack.rulesetIds,
      ...stack.vulnerabilityAlertIds,
      ...Object.values(organizations).map(({ workflowPermissions }) => workflowPermissions.id),
    ])
    .apply((ids) => resolve(ids))
  const ids = await promise
  expect(ids.slice(0, 2)).toEqual(['id-organization-totto2727-org', 'id-organization-totto2727-dotfiles'])
  expect(stack).not.toHaveProperty('organizationIds')

  const providers = resources.filter(({ type }) => type === 'pulumi:providers:github')
  expect(providers.map(({ name }) => name).toSorted()).toEqual(['totto2727-dotfiles', 'totto2727-org'])
  for (const owner of ['totto2727-org', 'totto2727-dotfiles']) {
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
  expect(resources.filter(({ type }) => type === 'github:index/membership:Membership')).toHaveLength(0)
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
  expect(resources.some(({ name }) => name.includes('archive'))).toBe(false)
  expect(
    resources.filter(({ type }) => type === 'github:index/organizationSettings:OrganizationSettings'),
  ).toHaveLength(2)
})

import * as pulumi from '@pulumi/pulumi'
import { expect, test } from 'vite-plus/test'

test('loads the complete stack with only the two managed organizations and preserves repository resource identities', async () => {
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
  const config = {
    'githubOwners:totto2727OrgToken': 'test-org-token',
    'githubOwners:totto2727DotfilesToken': 'test-dotfiles-token',
    'githubOwners:totto2727OrgBillingEmail': 'org@example.invalid',
    'githubOwners:totto2727DotfilesBillingEmail': 'dotfiles@example.invalid',
  }
  pulumi.runtime.setAllConfig(config, Object.keys(config))
  const stack = await import('../index.ts')
  const { organizations } = await import('./organizations.ts')
  const { promise, resolve } = Promise.withResolvers<boolean>()
  pulumi
    .all([
      ...stack.organizationIds,
      ...stack.maintainerTeamIds,
      ...stack.rulesetIds,
      ...stack.vulnerabilityAlertIds,
      ...organizations.flatMap(({ teamMembers, teamRepositories, workflowPermissions }) => [
        teamMembers.id,
        workflowPermissions.id,
        ...teamRepositories.map(({ id }) => id),
      ]),
    ])
    .apply(() => resolve(true))
  await promise

  const providers = resources.filter(({ type }) => type === 'pulumi:providers:github')
  expect(providers.map(({ name }) => name).toSorted()).toEqual(['totto2727-dotfiles', 'totto2727-org'])
  const repositories = resources.filter(({ type }) => type === 'github:index/repository:Repository')
  expect(repositories).toHaveLength(38)
  const grants = resources.filter(({ type }) => type === 'github:index/teamRepository:TeamRepository')
  expect(grants).toHaveLength(repositories.length)
  for (const repository of repositories) {
    const grant = grants.find(
      ({ inputs, provider }) => inputs['repository'] === repository.inputs['name'] && provider === repository.provider,
    )
    expect(grant?.inputs['permission']).toBe('push')
    expect(repository.name).toBe(
      `repository-${repository.inputs['name'] === 'nix' ? 'totto2727-dotfiles' : 'totto2727-org'}-${repository.inputs['name']}`,
    )
  }
  expect(resources.find(({ name }) => name === 'maintainers-members-totto2727-org')?.inputs['members']).toEqual([
    { role: 'maintainer', username: 'totto2727' },
    { role: 'member', username: 'totto2727-ai' },
  ])
  expect(resources.find(({ name }) => name === 'maintainers-members-totto2727-dotfiles')?.inputs['members']).toEqual([
    { role: 'maintainer', username: 'totto2727' },
  ])
  expect(new Set(resources.map(({ name }) => name)).size).toBe(resources.length)
  expect(resources.some(({ name }) => name.includes('archive'))).toBe(false)
  expect(
    resources.filter(({ type }) => type === 'github:index/organizationSettings:OrganizationSettings'),
  ).toHaveLength(2)
})

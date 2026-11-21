import * as pulumi from '@pulumi/pulumi'
import { expect, expectTypeOf, test } from 'vite-plus/test'

type ArrayOutputNames<Stack> = {
  [Name in keyof Stack]: Extract<pulumi.Unwrap<Stack[Name]>, readonly unknown[]> extends never ? never : Name
}[keyof Stack]

test('AWS, Cloudflare, and GitHub stack outputs must not be arrays', () => {
  expectTypeOf<ArrayOutputNames<typeof import('../../aws/index.ts')>>().toBeNever()
  expectTypeOf<ArrayOutputNames<typeof import('../../cloudflare/index.ts')>>().toBeNever()
  expectTypeOf<ArrayOutputNames<typeof import('../index.ts')>>().toBeNever()
})

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
  const { promise: outputsPromise, resolve: resolveOutputs } = Promise.withResolvers<Record<string, string>>()
  pulumi.all({ ...stack }).apply(resolveOutputs)
  const { promise, resolve } = Promise.withResolvers<string[]>()
  pulumi
    .all([
      ...Object.values(organizations).map(({ workflowPermissions }) => workflowPermissions.id),
      ...Object.values(memberships).map(({ id }) => id),
    ])
    .apply(resolve)
  const [outputs] = await Promise.all([outputsPromise, promise])

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
  expect(repositories).toHaveLength(44)
  expect(resources.map(({ name }) => name)).not.toContain('repository-totto2727-org-any-collection')
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
  const expectedOutputs: Record<string, string> = {
    totto2727OrgId: 'id-organization-totto2727-org',
    totto2727DotfilesId: 'id-organization-totto2727-dotfiles',
    totto2727ArchiveId: 'id-organization-totto2727-archive',
  }
  for (const { name: logicalName, inputs } of repositories) {
    const name = inputs['name']
    if (typeof name !== 'string') throw new Error(`Expected a repository name for ${logicalName}`)
    const [owner, ownerKey] =
      name === 'nix' ? ['totto2727-dotfiles', 'totto2727Dotfiles'] : ['totto2727-org', 'totto2727Org']
    const repositoryKey = name.replace(/(^|[.-])([a-z])/g, (_, _separator: string, letter: string) =>
      letter.toUpperCase(),
    )
    const outputKey = `${ownerKey}${repositoryKey}`
    const resourceKey = name === 'model' ? 'serde' : name
    expect(logicalName).toBe(`repository-${owner}-${resourceKey}`)
    expectedOutputs[`${outputKey}RepositoryName`] = name
    expectedOutputs[`${outputKey}RulesetId`] = `id-default-branch-${owner}-${resourceKey}`
    expectedOutputs[`${outputKey}VulnerabilityAlertId`] = `id-vulnerability-alerts-${owner}-${resourceKey}`
  }
  expect(outputs).toEqual(expectedOutputs)
  expect(resources.filter(({ type }) => type === 'github:index/repositoryRuleset:RepositoryRuleset')).toHaveLength(
    repositories.length,
  )
  expect(
    resources.filter(({ type }) => type === 'github:index/repositoryVulnerabilityAlerts:RepositoryVulnerabilityAlerts'),
  ).toHaveLength(repositories.length)
  expect(new Set(resources.map(({ name }) => name)).size).toBe(resources.length)
  expect(repositories.some(({ name }) => name.includes('archive'))).toBe(false)
  expect(
    resources.filter(({ type }) => type === 'github:index/organizationSettings:OrganizationSettings'),
  ).toHaveLength(3)
})

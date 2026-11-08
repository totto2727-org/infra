import * as pulumi from '@pulumi/pulumi'
import { expect, test } from 'vite-plus/test'

test('adopts only nix for the dotfiles owner with the shared required check', async () => {
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
  pulumi.runtime.setAllConfig({ 'githubOwners:totto2727DotfilesToken': 'test-dotfiles-token' }, [
    'githubOwners:totto2727DotfilesToken',
  ])
  const repositories = await import('./totto2727-dotfiles.ts')
  expect(Object.keys(repositories)).toEqual(['nix'])
  const { nix } = repositories
  const { promise, resolve } = Promise.withResolvers<boolean>()
  pulumi.all([nix.repository.id, nix.ruleset.id, nix.vulnerabilityAlerts.id]).apply(() => {
    resolve(true)
  })
  await promise

  expect(resources.map(({ name }) => name).toSorted()).toEqual([
    'default-branch-totto2727-dotfiles-nix',
    'repository-totto2727-dotfiles-nix',
    'totto2727-dotfiles',
    'vulnerability-alerts-totto2727-dotfiles-nix',
  ])
  expect(resources.find(({ name }) => name === 'totto2727-dotfiles')?.inputs).toMatchObject({
    owner: 'totto2727-dotfiles',
    token: {
      [pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
      value: 'test-dotfiles-token',
    },
  })
  for (const resource of resources.filter(({ type }) => type !== 'pulumi:providers:github')) {
    expect(resource.provider).toContain('pulumi:providers:github::totto2727-dotfiles::id-totto2727-dotfiles')
  }
  expect(resources.find(({ name }) => name === 'repository-totto2727-dotfiles-nix')?.inputs).toMatchObject({
    description: '',
    fork: 'false',
    hasIssues: true,
    homepageUrl: '',
    isTemplate: false,
    name: 'nix',
    topics: [],
    visibility: 'public',
  })
  expect(resources.find(({ name }) => name === 'default-branch-totto2727-dotfiles-nix')?.inputs).toMatchObject({
    rules: {
      deletion: true,
      nonFastForward: true,
      pullRequest: {},
      requiredStatusChecks: {
        requiredChecks: [{ context: 'check', integrationId: 15_368 }],
      },
    },
  })
  expect(resources.find(({ name }) => name === 'vulnerability-alerts-totto2727-dotfiles-nix')?.inputs).toEqual({
    enabled: true,
    repository: 'nix',
  })
})

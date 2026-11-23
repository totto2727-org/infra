import * as pulumi from '@pulumi/pulumi'
import { beforeAll, expect, test } from 'vite-plus/test'

const resources: pulumi.runtime.MockResourceArgs[] = []

beforeAll(async () => {
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
  pulumi.runtime.setAllConfig({ 'githubOwners:totto2727OrgToken': 'test-org-token' }, [
    'githubOwners:totto2727OrgToken',
  ])
  const repositories = await import('./totto2727-org.ts')
  const { promise, resolve } = Promise.withResolvers<boolean>()
  pulumi
    .all(
      Object.values(repositories).flatMap(({ repository, ruleset, vulnerabilityAlerts }) => [
        repository.id,
        ruleset.id,
        vulnerabilityAlerts.id,
      ]),
    )
    .apply(() => {
      resolve(true)
    })
  await promise
})

test.each([
  { repository: 'projektor', contexts: ['check'] },
  { repository: 'mdts', contexts: ['check'] },
  { repository: 'nix-cache', contexts: ['check'] },
  { repository: 'effect-http', contexts: ['check'] },
  { repository: 'effect-identify', contexts: ['check'] },
  { repository: 'syntree.mbt', contexts: ['check'] },
  { repository: 'tui.mbt', contexts: ['check'] },
  { repository: 'llm', contexts: ['test'] },
])('requires the current $repository CI checks without weakening branch protection', ({ repository, contexts }) => {
  expect(resources.find(({ name }) => name === `default-branch-totto2727-org-${repository}`)?.inputs).toMatchObject({
    conditions: { refName: { excludes: [], includes: ['~DEFAULT_BRANCH'] } },
    enforcement: 'active',
    repository,
    rules: {
      deletion: true,
      nonFastForward: true,
      pullRequest: {
        allowedMergeMethods: ['merge'],
        requiredApprovingReviewCount: 0,
      },
      requiredStatusChecks: {
        doNotEnforceOnCreate: false,
        requiredChecks: contexts.map((context) => ({ context, integrationId: 15_368 })),
        strictRequiredStatusChecksPolicy: false,
      },
    },
    target: 'branch',
  })
})

test.each(['syntree.mbt', 'tui.mbt', 'llm'])('adopts the existing public %s fork with its upstream source', (name) => {
  const repository = resources.find((resource) => resource.name === `repository-totto2727-org-${name}`)
  expect(repository).toMatchObject({
    id: name,
    inputs: {
      name,
      fork: 'true',
      hasIssues: false,
      sourceOwner: 'mizchi',
      sourceRepo: name,
      visibility: 'public',
    },
  })
  expect(repository?.inputs).not.toHaveProperty('template')
})

test('adopts the public moon-nix fork without requiring a nonexistent CI check', () => {
  const repository = resources.find(({ name }) => name === 'repository-totto2727-org-moon-nix')
  expect(repository).toMatchObject({
    id: 'moon-nix',
    inputs: {
      name: 'moon-nix',
      fork: 'true',
      hasIssues: false,
      sourceOwner: 'moonbit-community',
      sourceRepo: 'moon-nix',
      visibility: 'public',
    },
  })
  const ruleset = resources.find(({ name }) => name === 'default-branch-totto2727-org-moon-nix')
  expect(ruleset?.inputs).toMatchObject({ enforcement: 'active', rules: { deletion: true, nonFastForward: true } })
  expect(ruleset?.inputs.rules).not.toHaveProperty('requiredStatusChecks')
})

test('tracks the renamed Model repository with its original template and protections', () => {
  const repository = resources.find(({ name }) => name === 'repository-totto2727-org-model')
  expect(repository).toMatchObject({
    id: 'model',
    inputs: {
      name: 'model',
      hasIssues: true,
      template: {
        includeAllBranches: false,
        owner: 'totto2727-org',
        repository: 'template-moonbit-simple',
      },
      visibility: 'public',
    },
  })
  const ruleset = resources.find(({ name }) => name === 'default-branch-totto2727-org-model')
  expect(ruleset?.inputs).toMatchObject({
    repository: 'model',
    enforcement: 'active',
    rules: {
      deletion: true,
      nonFastForward: true,
      requiredStatusChecks: { requiredChecks: [{ context: 'check', integrationId: 15_368 }] },
    },
  })
  const alerts = resources.find(({ name }) => name === 'vulnerability-alerts-totto2727-org-model')
  expect(alerts?.inputs).toMatchObject({ repository: 'model', enabled: true })
})

test.each(['effect-http', 'effect-identify'])(
  'adopts existing %s with the shared public security policy without changing its template source',
  (name) => {
    const repository = resources.find((resource) => resource.name === `repository-totto2727-org-${name}`)
    expect(repository).toMatchObject({
      id: name,
      inputs: {
        name,
        hasIssues: true,
        visibility: 'public',
        securityAndAnalysis: {
          secretScanning: { status: 'enabled' },
          secretScanningPushProtection: { status: 'enabled' },
        },
        template: {
          includeAllBranches: false,
          owner: 'totto2727-org',
          repository: 'template-vite-plus-lib',
        },
      },
    })
    expect(repository?.provider).toContain('pulumi:providers:github::totto2727-org::id-totto2727-org')
  },
)

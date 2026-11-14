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

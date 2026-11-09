import * as pulumi from '@pulumi/pulumi'
import { expect, test } from 'vite-plus/test'

test('requires the current Projektor CI check without weakening branch protection', async () => {
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
  pulumi.runtime.setAllConfig({ 'githubOwners:totto2727OrgToken': 'test-org-token' }, [
    'githubOwners:totto2727OrgToken',
  ])
  const { projektor } = await import('./totto2727-org.ts')
  const { promise, resolve } = Promise.withResolvers<boolean>()
  pulumi.all([projektor.repository.id, projektor.ruleset.id, projektor.vulnerabilityAlerts.id]).apply(() => {
    resolve(true)
  })
  await promise

  expect(resources.find(({ name }) => name === 'default-branch-totto2727-org-projektor')?.inputs).toMatchObject({
    conditions: { refName: { excludes: [], includes: ['~DEFAULT_BRANCH'] } },
    enforcement: 'active',
    repository: 'projektor',
    rules: {
      deletion: true,
      nonFastForward: true,
      pullRequest: {
        allowedMergeMethods: ['merge'],
        requiredApprovingReviewCount: 0,
      },
      requiredStatusChecks: {
        doNotEnforceOnCreate: false,
        requiredChecks: [{ context: 'check', integrationId: 15_368 }],
        strictRequiredStatusChecksPolicy: false,
      },
    },
    target: 'branch',
  })
})

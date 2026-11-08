import * as pulumi from '@pulumi/pulumi'
import { expect, test } from 'vite-plus/test'

import { createRepositoryFactory } from './repository.ts'

test('isolates providers, credentials, and same-named repositories across owners', async () => {
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

  const dotfiles = createRepositoryFactory('totto2727-dotfiles', pulumi.secret('test-dotfiles-token'))
  const archives = createRepositoryFactory('totto2727-archives', pulumi.secret('test-archives-token'))
  const first = dotfiles('shared-name', {}, [])
  const second = archives('shared-name', {}, ['check'])
  const { promise, resolve } = Promise.withResolvers<boolean>()
  pulumi
    .all([
      first.repository.id,
      first.ruleset.id,
      first.vulnerabilityAlerts.id,
      second.repository.id,
      second.ruleset.id,
      second.vulnerabilityAlerts.id,
    ])
    .apply(() => {
      resolve(true)
    })
  await promise

  expect(new Set(resources.map(({ name }) => name)).size).toBe(8)
  expect(resources.find((resource) => resource.name === 'totto2727-dotfiles')?.inputs).toMatchObject({
    token: {
      [pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
      value: 'test-dotfiles-token',
    },
  })
  expect(resources.find((resource) => resource.name === 'totto2727-archives')?.inputs).toMatchObject({
    token: {
      [pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
      value: 'test-archives-token',
    },
  })
  for (const owner of ['totto2727-dotfiles', 'totto2727-archives']) {
    expect(
      resources.find((resource) => resource.type === 'pulumi:providers:github' && resource.name === owner)?.inputs,
    ).toMatchObject({ owner })
    for (const name of [
      `repository-${owner}-shared-name`,
      `default-branch-${owner}-shared-name`,
      `vulnerability-alerts-${owner}-shared-name`,
    ]) {
      expect(resources.find((resource) => resource.name === name)?.provider).toContain(
        `pulumi:providers:github::${owner}::id-${owner}`,
      )
    }
    expect(resources.find((resource) => resource.name === `repository-${owner}-shared-name`)?.id).toBe('')
    expect(resources.find((resource) => resource.name === `vulnerability-alerts-${owner}-shared-name`)?.inputs).toEqual(
      { enabled: true, repository: 'shared-name' },
    )
  }
  expect(
    resources.find((resource) => resource.name === 'default-branch-totto2727-dotfiles-shared-name')?.inputs,
  ).toMatchObject({ rules: { deletion: true } })
  expect(
    resources.find((resource) => resource.name === 'default-branch-totto2727-archives-shared-name')?.inputs,
  ).toMatchObject({
    rules: { requiredStatusChecks: { requiredChecks: [{ context: 'check', integrationId: 15_368 }] } },
  })
})

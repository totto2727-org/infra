import * as github from '@pulumi/github'
import type * as pulumi from '@pulumi/pulumi'

import { defaultBranchRules, repositorySettings } from './policy.ts'

export const createRepositoryFactory = (owner: string, provider: github.Provider) => {
  return (
    name: string,
    settings: github.RepositoryArgs = {},
    requiredChecks: readonly string[] = ['check'],
    adoption: Pick<pulumi.CustomResourceOptions, 'import'> = {},
  ) => {
    const repository = new github.Repository(
      `repository-${owner}-${name}`,
      { ...repositorySettings, ...settings, name },
      { ...adoption, protect: true, provider, retainOnDelete: true },
    )
    const ruleset = new github.RepositoryRuleset(
      `default-branch-${owner}-${name}`,
      {
        // Existing rulesets and classic branch protection remain outside this stack.
        bypassActors: [
          { actorType: 'OrganizationAdmin', bypassMode: 'always' },
          { actorId: 5, actorType: 'RepositoryRole', bypassMode: 'always' },
        ],
        conditions: { refName: { excludes: [], includes: ['~DEFAULT_BRANCH'] } },
        enforcement: 'active',
        name: 'Workspace default branch',
        repository: repository.name,
        rules: defaultBranchRules(requiredChecks),
        target: 'branch',
      },
      { protect: true, provider, retainOnDelete: true },
    )
    const vulnerabilityAlerts = new github.RepositoryVulnerabilityAlerts(
      `vulnerability-alerts-${owner}-${name}`,
      { enabled: true, repository: repository.name },
      { protect: true, provider, retainOnDelete: true },
    )
    return { repository, ruleset, vulnerabilityAlerts }
  }
}

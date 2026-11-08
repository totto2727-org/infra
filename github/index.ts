import * as dotfiles from './src/totto2727-dotfiles.ts'
import * as org from './src/totto2727-org.ts'

const repositories = { ...org, ...dotfiles }

export const repositoryNames = Object.values(repositories).map(({ repository }) => repository.name)
export const rulesetIds = Object.values(repositories).map(({ ruleset }) => ruleset.id)
export const vulnerabilityAlertIds = Object.values(repositories).map(
  ({ vulnerabilityAlerts }) => vulnerabilityAlerts.id,
)

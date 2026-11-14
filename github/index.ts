import { totto2727Dotfiles, totto2727Org } from './src/organizations.ts'
import * as dotfiles from './src/totto2727-dotfiles.ts'
import * as org from './src/totto2727-org.ts'

const repositories = { ...org, ...dotfiles }

export const repositoryNames = Object.values(repositories).map(({ repository }) => repository.name)
export const rulesetIds = Object.values(repositories).map(({ ruleset }) => ruleset.id)
export const vulnerabilityAlertIds = Object.values(repositories).map(
  ({ vulnerabilityAlerts }) => vulnerabilityAlerts.id,
)
export const totto2727OrgId = totto2727Org.settings.id
export const totto2727DotfilesId = totto2727Dotfiles.settings.id

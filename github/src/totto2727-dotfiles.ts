import { createRepositoryFactory } from './repository.ts'
import { dotfilesProvider } from './totto2727-dotfiles-provider.ts'

const createRepository = createRepositoryFactory('totto2727-dotfiles', dotfilesProvider)

export const nix = createRepository('nix', {
  description: 'Shared Nix development environments and GitHub Actions',
})

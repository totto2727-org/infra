import * as github from '@pulumi/github'

import { archiveProvider } from './totto2727-archive-provider.ts'
import { dotfilesProvider } from './totto2727-dotfiles-provider.ts'
import { orgProvider } from './totto2727-org-provider.ts'

export const totto2727OrgOwner = new github.Membership(
  'membership-totto2727-org-totto2727',
  { username: 'totto2727', role: 'admin' },
  {
    provider: orgProvider,
    import: 'totto2727-org:totto2727',
    protect: true,
    retainOnDelete: true,
  },
)

export const totto2727OrgAiMember = new github.Membership(
  'membership-totto2727-org-totto2727-ai',
  { username: 'totto2727-ai', role: 'member' },
  {
    provider: orgProvider,
    import: 'totto2727-org:totto2727-ai',
    protect: true,
    retainOnDelete: true,
  },
)

export const totto2727DotfilesOwner = new github.Membership(
  'membership-totto2727-dotfiles-totto2727',
  { username: 'totto2727', role: 'admin' },
  {
    provider: dotfilesProvider,
    import: 'totto2727-dotfiles:totto2727',
    protect: true,
    retainOnDelete: true,
  },
)

export const totto2727DotfilesAiMember = new github.Membership(
  'membership-totto2727-dotfiles-totto2727-ai',
  { username: 'totto2727-ai', role: 'member' },
  { provider: dotfilesProvider, protect: true, retainOnDelete: true },
)

export const totto2727ArchiveOwner = new github.Membership(
  'membership-totto2727-archive-totto2727',
  { username: 'totto2727', role: 'admin' },
  {
    provider: archiveProvider,
    import: 'totto2727-archive:totto2727',
    protect: true,
    retainOnDelete: true,
  },
)

export const totto2727ArchiveAiMember = new github.Membership(
  'membership-totto2727-archive-totto2727-ai',
  { username: 'totto2727-ai', role: 'member' },
  { provider: archiveProvider, protect: true, retainOnDelete: true },
)

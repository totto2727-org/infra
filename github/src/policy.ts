import type * as github from '@pulumi/github'
import { Array } from 'effect'

export const repositorySettings: Omit<github.RepositoryArgs, 'name'> = {
  allowAutoMerge: true,
  allowForking: true,
  allowMergeCommit: true,
  allowRebaseMerge: false,
  allowSquashMerge: false,
  allowUpdateBranch: true,
  archived: false,
  deleteBranchOnMerge: true,
  description: '',
  fork: 'false',
  hasDiscussions: false,
  hasIssues: true,
  hasProjects: false,
  hasWiki: false,
  homepageUrl: '',
  isTemplate: false,
  mergeCommitMessage: 'PR_TITLE',
  mergeCommitTitle: 'MERGE_MESSAGE',
  securityAndAnalysis: {
    secretScanning: { status: 'enabled' },
    secretScanningNonProviderPatterns: { status: 'disabled' },
    secretScanningPushProtection: { status: 'enabled' },
  },
  topics: [],
  visibility: 'public',
  webCommitSignoffRequired: true,
}

export const defaultBranchRules = (requiredChecks: readonly string[]): github.types.input.RepositoryRulesetRules => ({
  deletion: true,
  nonFastForward: true,
  pullRequest: {
    allowedMergeMethods: ['merge'],
    dismissStaleReviewsOnPush: false,
    requireCodeOwnerReview: false,
    requireLastPushApproval: false,
    requiredApprovingReviewCount: 0,
    requiredReviewThreadResolution: false,
  },
  ...(Array.isReadonlyArrayNonEmpty(requiredChecks)
    ? {
        requiredStatusChecks: {
          doNotEnforceOnCreate: false,
          // GitHub Actions App ID, verified against GET /apps/github-actions.
          requiredChecks: requiredChecks.map((context) => ({ context, integrationId: 15_368 })),
          strictRequiredStatusChecksPolicy: false,
        },
      }
    : {}),
})

# Managed GitHub organization settings

This reference describes the desired policy in [`src/organization.ts`](./src/organization.ts).
It does not assert that the policy is deployed.
Only `totto2727-org` and `totto2727-dotfiles` are managed.
`totto2727-archive` is excluded.

## Shared policy

| Area                                   | Desired setting              | Scope and effect                                                                                                                                                         |
| -------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Base repository permission             | `none`                       | Members need an explicit repository or team grant. Public repositories remain publicly readable. Owners retain their owner privileges.                                   |
| Repository creation                    | Owners only                  | Ordinary members cannot create public, private, or internal repositories. The member restriction does not prevent an authorized installation from creating repositories. |
| GitHub Pages creation                  | Owners only                  | Ordinary members cannot create public or private Pages sites. This does not remove existing sites.                                                                       |
| Private repository forks               | Disabled for members         | Prevents new private forks. It does not remove existing forks.                                                                                                           |
| Web commit sign-off                    | Required                     | Requires the web editor's sign-off. This is not cryptographic commit signing.                                                                                            |
| Dependency graph                       | Enabled for new repositories | Does not retrofit repositories outside this stack.                                                                                                                       |
| Dependabot alerts and security updates | Enabled for new repositories | Existing repository vulnerability alerts remain managed by the repository factory.                                                                                       |
| Secret scanning and push protection    | Enabled for new repositories | Free public-repository coverage where GitHub supports it. Private coverage can require paid products.                                                                    |
| Paid Advanced Security auto-enablement | Disabled                     | Avoids enrolling new private repositories in paid features without approval.                                                                                             |
| Default `GITHUB_TOKEN` permissions     | Read                         | Workflows that need writes must declare explicit `permissions`. This is a default, not a prohibition on explicit write permissions.                                      |
| Workflow pull request approval         | Disabled                     | Prevents GitHub Actions from approving pull request reviews through this organization setting.                                                                           |

Organization profile fields, billing address identity, and Projects availability are not normalized.
The required `billingEmail` is read from each owner's secret configuration and must match the existing value.
Profile fields and Projects settings use `ignoreChanges` after import.
Existing repository merge policies and resource names remain unchanged.

## Teams and access

Both organizations have a secret `maintainers` team.
The team receives `push` access to each repository declared for that owner in this stack, not repository administration.
A team maintainer role administers that team, not the organization.

| Organization         | Team maintainers | Team members   | Repository grants                                         |
| -------------------- | ---------------- | -------------- | --------------------------------------------------------- |
| `totto2727-org`      | `totto2727`      | `totto2727-ai` | Only repositories declared in `src/totto2727-org.ts`      |
| `totto2727-dotfiles` | `totto2727`      | None           | Only repositories declared in `src/totto2727-dotfiles.ts` |

`TeamMembers` owns the complete roster of these teams.
An unlisted member added through the UI is removed from the managed team on the next update, but not from the organization.
Existing organization memberships, owner roles, outside collaborators, and unrelated teams are not adopted or deleted.
New repository grants depend on team membership, and the base-permission change depends on every managed team grant.
This ordering avoids dropping implicit access before the replacement grants exist.
It does not preserve implicit access to repositories outside the declared inventory.
In particular, `totto2727-ai` loses inherited write access to undeclared `totto2727-org` repositories when the base permission changes to `none`.
Review that reduction before deployment and add only justified explicit grants.

All new resources use `protect: true` and `retainOnDelete: true`.
Deletion protection prevents normal resource deletion.
Retention leaves remote objects in place if they are deliberately removed from state after protection is removed.
Neither option prevents an in-place permission reduction or a roster update.

## Settings outside this implementation

| Area                                                                                    | Reason and required follow-up                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mandatory 2FA and secure 2FA methods                                                    | `OrganizationSettings` in the installed GitHub provider 6.15.1 exposes no 2FA input. Require 2FA in both organization Security settings after checking member and outside-collaborator compliance. Enabling the requirement can remove noncompliant accounts. Do not disable the existing requirement in `totto2727-org`. |
| Member and owner lifecycle                                                              | Deliberately not authoritative. Preserve the existing owner and review invitations, outside collaborators, dormant users, and recovery access manually. Do not invent or promote a second owner.                                                                                                                          |
| Member team creation, repository deletion, transfer, and visibility-change restrictions | Not exposed by this version's `OrganizationSettings`. Review the corresponding member-privilege controls in GitHub settings where available. Ordinary-member repository creation restrictions do not cover all these controls.                                                                                            |
| OAuth App restrictions and GitHub App installation approval                             | Not declared here. Review approved integrations and keep third-party access restricted through the organization's settings.                                                                                                                                                                                               |
| Classic and fine-grained PAT policies, approval, and token lifetimes                    | Not exposed by this version's organization-settings resource. Review the Personal access token settings for each organization.                                                                                                                                                                                            |
| Allowed Actions, SHA pinning, and fork workflow approval                                | Separate Actions policy surfaces, not implied by read-only token defaults. Audit all organization workflows, including undeclared repositories and reusable workflows, before enforcing a common allowlist or mandatory SHA pinning. Mutable tag references can stop working when pinning is required.                    |
| Self-hosted runners and runner groups                                                   | Not declared or inventoried. Do not run untrusted public-fork code on persistent self-hosted runners. Review runner access separately.                                                                                                                                                                                    |
| Organization Secrets, variables, webhooks, deploy keys, Packages, and Codespaces        | Not adopted. Values and operational dependencies need a separate inventory and permission review.                                                                                                                                                                                                                         |
| Existing repositories outside the stack                                                 | New-repository security defaults do not retrofit them. Add repositories explicitly before asserting full repository security coverage.                                                                                                                                                                                    |
| SAML SSO, SCIM, team synchronization, IP allow lists, and custom organization roles     | Product, identity-provider, or enterprise prerequisites apply. Both organizations were on GitHub Free at discovery. No subscription or external identity configuration is purchased or changed.                                                                                                                           |
| Billing, organization creation, renaming, and deletion                                  | Outside this stack. Preserve the existing billing email when adopting `OrganizationSettings`.                                                                                                                                                                                                                             |

“Outside this implementation” is not the same as “impossible through every GitHub API.”
Some items have separate resources or API endpoints, while others need a plan upgrade or UI action.
They are listed explicitly so that the shared policy is not mistaken for complete organization governance.

## References

- [Pulumi OrganizationSettings](https://www.pulumi.com/registry/packages/github/api-docs/organizationsettings/)
- [Pulumi TeamMembers](https://www.pulumi.com/registry/packages/github/api-docs/teammembers/)
- [Pulumi TeamRepository](https://www.pulumi.com/registry/packages/github/api-docs/teamrepository/)
- [Pulumi ActionsOrganizationWorkflowPermissions](https://www.pulumi.com/registry/packages/github/api-docs/actionsorganizationworkflowpermissions/)
- [Pulumi ActionsOrganizationPermissions](https://www.pulumi.com/registry/packages/github/api-docs/actionsorganizationpermissions/)
- [GitHub organization REST API](https://docs.github.com/en/rest/orgs/orgs)
- [Require 2FA in an organization](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-two-factor-authentication-for-your-organization/requiring-two-factor-authentication-in-your-organization)
- [Manage GitHub Actions settings for an organization](https://docs.github.com/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization)

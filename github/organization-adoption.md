# Adopt GitHub organization settings

Use this procedure before the first deployment of the organization resources.
Do not run `just github-up` until the permission review, imports, and refreshed preview pass.
This procedure does not create or transfer an organization.

## Authorize the organization resources

1. Restore valid GitHub App installation credentials in `totto2727/github/production` before importing or previewing.
2. Add the organization permissions required by the resources to the existing GitHub App.
3. Approve the changed installation permissions in both organizations.
4. Include the approved permissions in both ESC `gh-login` token requests, not only the App registration.
5. Retain the repository permission and repository selection requirements in the [GitHub guide](./README.md).

| Resource                               | Required capability                                                                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organization settings                  | Organization Administration: read and write                                                                                                                                 |
| Team and complete team roster          | Organization Members: read and write                                                                                                                                        |
| Team repository grants                 | Organization Members and repository Administration: read and write                                                                                                          |
| Organization Actions workflow defaults | Organization Actions policy administration. Check the current GitHub App permission list and the endpoint's fine-grained permission requirements before requesting a token. |

The existing repository-only token request is insufficient for organization administration.
Do not guess an installation-token permission identifier from an API error or substitute a personal token for the stack's credentials.
If the App or ESC token issuer does not support a required permission, leave that resource undeployed and record the limitation.

## Preserve each billing email

`OrganizationSettings` requires a billing email even when only security settings change.
Read each organization's existing billing email with an authorized owner account.
Do not copy the address into a repository, PR, or command line.

Add secret values under `values.organizationBilling` in ESC, using the current address for each owner:

```yaml
values:
  organizationBilling:
    totto2727Org:
      fn::secret: REPLACE_WITH_CURRENT_ORG_BILLING_EMAIL
    totto2727Dotfiles:
      fn::secret: REPLACE_WITH_CURRENT_DOTFILES_BILLING_EMAIL
  pulumiConfig:
    githubOwners:totto2727OrgBillingEmail: ${organizationBilling.totto2727Org}
    githubOwners:totto2727DotfilesBillingEmail: ${organizationBilling.totto2727Dotfiles}
```

Merge these fields into the existing environment.
Do not replace its App credentials, token definitions, or other `pulumiConfig` keys.
The placeholders must not reach a deployment.

## Review the access reduction

1. Confirm that `totto2727` remains an active owner of both organizations.
2. Review the complete repository inventory and current team, collaborator, and member grants with an authorized account.
3. Confirm that `totto2727-ai` is still a member of `totto2727-org` before including that user in the team roster.
4. Review the effect of changing the base repository permission to `none`.
5. Add only justified explicit grants for repositories outside the declared inventory before removing their inherited access.
6. Review workflows that depend on inherited write permissions for `GITHUB_TOKEN` before changing the default to read.

Do not enable mandatory 2FA until every affected account and outside collaborator is checked.
The current provider cannot manage that requirement.
Follow the [manual security controls](./managed-settings.md#settings-outside-this-implementation) separately.

## Import the existing settings

Run commands from the repository root.
The import manifest uses the existing numeric organization IDs and existing owner-specific Provider URNs.

```bash
pulumi stack select production --cwd github
just github-import-organizations
```

Review the import preview before confirming it.
The manifest adopts only organization settings and organization Actions workflow defaults.
It does not import organization memberships or repositories.
The `maintainers` teams were absent at discovery, so their definitions are new resources.
If a matching team now exists, import that team and its roster before applying the declarations.
Do not create a duplicate team or replace an unrelated team.

## Validate and deploy

```bash
vp run ci
pulumi preview --cwd github --stack production --refresh --diff
```

Verify these conditions before deployment:

- Existing Provider and repository URNs do not change.
- No organization, repository, owner membership, profile, billing email, or Projects setting is deleted, replaced, or unexpectedly changed.
- Each declared repository has the intended team write grant in the correct owner.
- The complete team rosters match the reviewed account inventory.
- Only the documented organization settings and reviewed Actions defaults change.
- The archive organization does not appear.
- No existing workflow loses a required write permission without an explicit replacement.

After reviewing the successful preview, deploy with `just github-up`.
Then verify the remote organization settings, team rosters, repository grants, Actions defaults, and a representative repository workflow in each organization.
Repeat a refreshed preview and confirm that it proposes no further changes for these resources.
A passing mock test is not a substitute for this remote verification.

## Authentication failures

A `401 Bad credentials` during preview is an authentication blocker, not a successful policy check.
Restore the existing App installation and ESC token issuance path before trying again.
Do not print tokens or bypass the blocker with another account.

An owner-account `gh api` call can also return `403` when the token lacks organization administration scopes.
If owner-only inspection is needed, the user can authorize the existing account with `gh auth refresh -h github.com -s admin:org`.
This command is interactive and is not run by the agent.
The user-account scope does not replace the App installation permissions or fix the stack's separate credential failure.

## References

- [Import existing Pulumi resources](https://www.pulumi.com/docs/iac/adopting-pulumi/import/)
- [Update an organization](https://docs.github.com/en/rest/orgs/orgs#update-an-organization)
- [GitHub Actions organization permissions](https://docs.github.com/en/rest/actions/permissions)
- [GitHub team members](https://docs.github.com/en/rest/teams/members)
- [GitHub App installation access tokens](https://docs.github.com/en/rest/apps/apps#create-an-installation-access-token-for-an-app)

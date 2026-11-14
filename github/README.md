# GitHub Infrastructure

This guide is for maintainers who configure GitHub App authentication and deploy organization and repository settings with Pulumi.
The managed organizations are `totto2727-org`, `totto2727-dotfiles`, and `totto2727-archive`.
Only the first two organizations have repository resources in this stack.
`totto2727` is an organization owner (`admin`), and `totto2727-ai` is a `member` in each organization.
Organization members have base repository `write` access and can create public and private repositories.
These organization-wide privileges also apply to future members.

## Prerequisites

- Install the Pulumi CLI and run `pulumi login`.
- Use Pulumi organization `totto2727` and stack `production`.
- Have permission to register and install a GitHub App in each managed GitHub organization.
- Run commands from the repository root.

## GitHub App configuration

The GitHub App is registered in [`totto2727-org`](https://github.com/organizations/totto2727-org/settings/apps/new) with these settings:

| Setting                                        | Value                                    |
| ---------------------------------------------- | ---------------------------------------- |
| GitHub App name                                | A unique name of your choice             |
| Homepage URL                                   | `https://github.com/totto2727-org/infra` |
| Callback URL                                   | Leave empty                              |
| Request user authorization during installation | Disabled                                 |
| Device Flow                                    | Disabled                                 |
| Webhook: Active                                | Disabled                                 |
| Where can this GitHub App be installed?        | **Any account**                          |

The App requires these permissions in all three installations:

| Scope        | Permission     | Level          |
| ------------ | -------------- | -------------- |
| Repository   | Administration | Read and write |
| Repository   | Contents       | Read and write |
| Repository   | Metadata       | Read-only      |
| Organization | Administration | Read and write |
| Organization | Members        | Read and write |
| Account      | All            | No access      |

Organization Administration covers organization settings and the Actions workflow defaults.
Members covers organization membership and roles.
This configuration uses installation tokens, not user OAuth authorization.

| Installation         | Repository access                                                    |
| -------------------- | -------------------------------------------------------------------- |
| `totto2727-org`      | Every repository in [`src/totto2727-org.ts`](./src/totto2727-org.ts) |
| `totto2727-dotfiles` | `nix`                                                                |
| `totto2727-archive`  | No repository resources are managed by this stack                    |

All installations require organization administrator approval for the permissions above.
Repository selection is **Only select repositories**, or **All repositories** when access to current and future repositories is intended.
App registration alone does not grant access to an organization.

## Pulumi ESC configuration

The ESC environment is `totto2727/github/production`, referenced as `github/production` in `Pulumi.production.yaml`.
It contains the numeric App ID, a PEM private key, and the existing billing email for each organization.
The App ID is distinct from the Client ID.

The environment definition is:

```yaml
values:
  githubApp:
    appId: 123456
    privateKey:
      fn::secret: |
        -----BEGIN RSA PRIVATE KEY-----
        REPLACE_WITH_PRIVATE_KEY
        -----END RSA PRIVATE KEY-----
  billingEmails:
    totto2727Org:
      fn::secret: REPLACE_WITH_EXISTING_ORG_BILLING_EMAIL
    totto2727Dotfiles:
      fn::secret: REPLACE_WITH_EXISTING_DOTFILES_BILLING_EMAIL
    totto2727Archive:
      fn::secret: REPLACE_WITH_EXISTING_ARCHIVE_BILLING_EMAIL
  tokens:
    totto2727Org:
      fn::open::gh-login:
        appId: ${githubApp.appId}
        privateKey: ${githubApp.privateKey}
        owner: totto2727-org
        permissions:
          administration: write
          contents: write
          metadata: read
          members: write
          organization_administration: write
    totto2727Dotfiles:
      fn::open::gh-login:
        appId: ${githubApp.appId}
        privateKey: ${githubApp.privateKey}
        owner: totto2727-dotfiles
        permissions:
          administration: write
          contents: write
          metadata: read
          members: write
          organization_administration: write
    totto2727Archive:
      fn::open::gh-login:
        appId: ${githubApp.appId}
        privateKey: ${githubApp.privateKey}
        owner: totto2727-archive
        permissions:
          administration: write
          contents: write
          metadata: read
          members: write
          organization_administration: write
  pulumiConfig:
    githubOwners:totto2727OrgToken: ${tokens.totto2727Org.accessToken}
    githubOwners:totto2727DotfilesToken: ${tokens.totto2727Dotfiles.accessToken}
    githubOwners:totto2727ArchiveToken: ${tokens.totto2727Archive.accessToken}
    githubOwners:totto2727OrgBillingEmail: ${billingEmails.totto2727Org}
    githubOwners:totto2727DotfilesBillingEmail: ${billingEmails.totto2727Dotfiles}
    githubOwners:totto2727ArchiveBillingEmail: ${billingEmails.totto2727Archive}
```

`123456` and the `REPLACE_WITH_...` values are placeholders for the existing credentials and billing addresses.
The private key includes its BEGIN and END lines and remains encrypted with `fn::secret`.
Private keys and billing addresses stay in ESC, not in source control or chat.

ESC uses `gh-login` to issue an installation token with a one-hour lifetime.
The App ID and private key are shared, but ESC issues a separate installation token for each owner.
Pulumi reads each token through its `githubOwners` secret configuration key and passes it to that owner's Provider.
All three owner tokens and billing emails are required because the program loads all three organizations.
The billing email inputs preserve the existing billing details.
A PAT and a shared `GITHUB_TOKEN` environment variable are not required.
The App private key remains a long-lived credential. Revoke and replace it when needed.

## Verify and deploy

Select the production stack with `pulumi stack select production --cwd github`.
Run `just github-preview` to check authentication and the proposed changes.
For a preview that refreshes remote state and shows detailed differences, run:

```bash
pulumi preview --cwd github --stack production --refresh --run-program --diff
```

If ESC reports `the GitHub App is not installed for owner`, check the installation target and App ID.
If a repository is inaccessible, check the installation repository selection and App permissions.
Do not apply changes until authentication succeeds and you have reviewed the preview.

After approval, apply the reviewed changes:

```bash
just github-up
```

## Organization prerequisites and limits

Use the TypeScript declarations in `src/organizations.ts` and `src/organization.ts` as the source of truth.
Before the first deployment, import existing settings with `pulumi import`, using the corresponding owner-specific Provider and resource name.
The [OrganizationSettings import ID](https://www.pulumi.com/registry/packages/github/api-docs/organizationsettings/#import) is the current numeric organization ID.
The [Actions workflow permissions import ID](https://www.pulumi.com/registry/packages/github/api-docs/actionsorganizationworkflowpermissions/#import) is the organization slug.
No separate manifest or permanent import task is needed.

- Review inherited access before changing the base repository permission. Grants for declared repositories do not preserve access to undeclared private repositories.
- Organization memberships and their `admin` or `member` roles are managed in `src/memberships.ts`. Teams and individual repository access grants remain outside this stack.
- Package creation, inheritance, and per-package access controls require manual configuration because GitHub provider 6.15.1 has no corresponding resources. Repository write access and read-only workflow defaults do not guarantee a registry-write prohibition.
- The installed provider's organization-settings resource does not expose 2FA requirements, PAT policies, OAuth App restrictions, or all member-privilege controls. Review these in GitHub settings. Check affected accounts before enforcing 2FA because noncompliant accounts can lose access.
- SAML, SCIM, team synchronization, and IP allow lists have plan or identity-provider prerequisites. No paid services are enrolled by this stack.
- Actions allowlists and mandatory SHA pinning are not enforced here. Migrate mutable action references and verify workflow compatibility before enabling them.
- New-repository security defaults do not retrofit all existing repositories. Private-repository security features can require paid products.

Do not apply until authentication succeeds, existing settings are imported, and a refreshed preview has been reviewed.

## Add a repository

Add an individual `createRepository(...)` call to the module for its owner.
The factory applies the shared merge policy, branch rules, secret scanning, push protection, and vulnerability alerts.
Projects and Wiki are disabled. Preserve an existing Issues setting when you import a repository.
Use repository-specific settings only for real differences such as its description, source, template status, and CI names.

For a new repository, Pulumi can create it directly:

```ts
export const example = createRepository('example', {
  autoInit: true,
  description: 'Describe the purpose of this repository',
})
```

For a new fork, specify its source:

```ts
export const exampleFork = createRepository('example-fork', {
  description: 'Describe the purpose of this fork',
  fork: 'true',
  sourceOwner: 'upstream-owner',
  sourceRepo: 'upstream-repository',
})
```

For a repository generated from a template, specify `template`:

```ts
export const exampleFromTemplate = createRepository('example-from-template', {
  description: 'Describe the purpose of this repository',
  template: {
    includeAllBranches: false,
    owner: 'totto2727-org',
    repository: 'template-moonbit-simple',
  },
})
```

Set `isTemplate: true` only when the resulting repository must itself be available as a template.
The `template` setting selects a source. It does not mark the resulting repository as a template.
The third factory argument selects required CI contexts and defaults to `['check']`.
Use the actual workflow check names. Use `[]` only when the repository has no applicable CI check.

For an existing repository, import it before you apply the declaration.
Its Pulumi logical name is `repository-<owner>-<name>` and its import ID is the existing repository name.
Use credentials for the same owner.
Keep existing fork and template source values in its declaration.
Do not change creation-only source values on an existing repository: that can require replacement.
Check the preview for unexpected creation, replacement, deletion, or renaming before every deployment.

## Owner isolation

Each owner has a separate Provider and ESC installation token.
Organization settings and memberships use the corresponding owner-specific Provider.
Repository resources exist only for `totto2727-org` and `totto2727-dotfiles`.
A shared App private key can issue tokens for all installations of that App.
Separate Apps and private keys are required when credential isolation between owners is required.

## Checks

```bash
vp check github
vp test run github/
```

## References

- [Repository definitions](./src/totto2727-org.ts)
- [Pulumi ESC gh-login](https://www.pulumi.com/docs/esc/providers/login/gh-login/)
- [Registering a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)

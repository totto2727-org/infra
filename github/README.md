# GitHub Infrastructure

This guide is for maintainers who configure GitHub App authentication and deploy organization and repository settings with Pulumi.
The managed organizations are `totto2727-org` and `totto2727-dotfiles`.
`totto2727-archive` and its repositories are not managed by this stack.
See [organization policy and limitations](./managed-settings.md) and [adopt organization settings](./organization-adoption.md) before the first deployment.

## Prerequisites

- Install the Pulumi CLI and run `pulumi login`.
- Use Pulumi organization `totto2727` and stack `production`.
- Have permission to register and install a GitHub App in each managed GitHub organization.
- Run commands from the repository root.

## 1. Create a GitHub App

Open [Register new GitHub App](https://github.com/organizations/totto2727-org/settings/apps/new) in `totto2727-org`.
Use these settings:

| Setting                                        | Value                                    |
| ---------------------------------------------- | ---------------------------------------- |
| GitHub App name                                | A unique name of your choice             |
| Homepage URL                                   | `https://github.com/totto2727-org/infra` |
| Callback URL                                   | Leave empty                              |
| Request user authorization during installation | Disabled                                 |
| Device Flow                                    | Disabled                                 |
| Webhook: Active                                | Disabled                                 |
| Where can this GitHub App be installed?        | **Any account**                          |

Select **Any account** so that you can install the same App in other organizations later.
This setting does not grant access to those organizations.
An administrator must install the App in each organization.

Set these **Repository permissions**:

| Permission     | Level          |
| -------------- | -------------- |
| Administration | Read and write |
| Contents       | Read and write |
| Metadata       | Read-only      |

The organization resources also need organization-level permissions.
Follow the permission table in [adopt organization settings](./organization-adoption.md) and approve the updated installation in both organizations.
Do not add unrelated account permissions.
This configuration uses installation tokens, not user OAuth authorization.

After you create the App:

1. Record its **App ID** from the App settings page. Do not use the Client ID.
2. Select **Generate a private key** and download the PEM file.
3. Open **Install App** and select `totto2727-org`.
4. Select **Only select repositories** and grant access to every repository in [`src/totto2727-org.ts`](./src/totto2727-org.ts).
5. Complete the installation. App registration alone does not install the App.
6. Install the same App in `totto2727-dotfiles` and grant access to `nix`.

You can select **All repositories** instead if the App must access current and future repositories in that organization.
With **Only select repositories**, update the installation access before you add another repository to Pulumi.

## 2. Configure Pulumi ESC

In Pulumi Console, select organization `totto2727`.
Create ESC project `github` and environment `production`.
The full environment name is `totto2727/github/production`.
The stack configuration in `Pulumi.production.yaml` already references `github/production`.

Paste this complete definition for both managed owners into the ESC environment:

```yaml
values:
  githubApp:
    appId: 123456
    privateKey:
      fn::secret: |
        -----BEGIN RSA PRIVATE KEY-----
        REPLACE_WITH_PRIVATE_KEY
        -----END RSA PRIVATE KEY-----
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
    totto2727Dotfiles:
      fn::open::gh-login:
        appId: ${githubApp.appId}
        privateKey: ${githubApp.privateKey}
        owner: totto2727-dotfiles
        permissions:
          administration: write
          contents: write
          metadata: read
  pulumiConfig:
    githubOwners:totto2727OrgToken: ${tokens.totto2727Org.accessToken}
    githubOwners:totto2727DotfilesToken: ${tokens.totto2727Dotfiles.accessToken}
```

Replace `123456` with the numeric App ID.
Replace the private key block with the complete PEM file, including its BEGIN and END lines.
Keep the `fn::secret` wrapper and YAML indentation.
Save the environment without copying the private key into source control or chat.

ESC uses `gh-login` to issue an installation token with a one-hour lifetime.
The App ID and private key are shared, but ESC issues a separate installation token for each owner.
Pulumi reads each token through its `githubOwners` secret configuration key and passes it to that owner's Provider.
Both keys are required because the program loads both owner modules.
Organization resources also require each owner's existing billing email through `githubOwners:totto2727OrgBillingEmail` and `githubOwners:totto2727DotfilesBillingEmail`.
Store these values as secrets in ESC as described in [adopt organization settings](./organization-adoption.md).
Do not configure a token for `totto2727-archive`.
A PAT and a shared `GITHUB_TOKEN` environment variable are not required.
The App private key remains a long-lived credential. Revoke and replace it when needed.

## 3. Verify and deploy

Select the production stack with `pulumi stack select production --cwd github`.
Run `just github-preview` to check authentication and the proposed changes.
For a preview that refreshes remote state and shows detailed differences, run:

```bash
pulumi preview --cwd github --stack production --refresh --diff
```

If ESC reports `the GitHub App is not installed for owner`, check the installation target and App ID.
If a repository is inaccessible, check the installation repository selection and App permissions.
Do not apply changes until authentication succeeds and you have reviewed the preview.

After approval, apply the reviewed changes:

```bash
just github-up
```

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

## Add another owner

Keep all owner definitions in `github/`.
Add approved owners without a separate infrastructure directory.
The archive organization is explicitly outside this stack and must not be added through this procedure.
Do not add token definitions for an owner until the App is installed there.

1. Install the App in the additional organization and grant access to its managed repositories.
2. Add a separate token entry under `values.tokens`. For example:

   ```yaml
   totto2727Dotfiles:
     fn::open::gh-login:
       appId: ${githubApp.appId}
       privateKey: ${githubApp.privateKey}
       owner: totto2727-dotfiles
       permissions:
         administration: write
         contents: write
         metadata: read
   ```

3. Add the corresponding entry under `values.pulumiConfig`:

   ```yaml
   githubOwners:totto2727DotfilesToken: ${tokens.totto2727Dotfiles.accessToken}
   ```

4. Create an owner-specific module with a factory and individual repository definitions:

   ```ts
   import * as github from '@pulumi/github'
   import * as pulumi from '@pulumi/pulumi'

   import { createRepositoryFactory } from './repository.ts'

   const provider = new github.Provider('totto2727-dotfiles', {
     owner: 'totto2727-dotfiles',
     token: new pulumi.Config('githubOwners').requireSecret('totto2727DotfilesToken'),
   })
   const createRepository = createRepositoryFactory('totto2727-dotfiles', provider)

   export const example = createRepository('example')
   ```

   Define the repositories and their required settings.
   Import existing repositories before deployment, or let Pulumi create new ones.
   Import the module in `index.ts` and include its resources in the stack outputs.
   Keep repository and organization resources on the same owner-specific Provider.

Each factory binds its resources to an owner-specific Provider and includes the owner in Pulumi resource names.
Tokens are separate for each installation.
However, a shared App private key can issue tokens for all of that App's installations.
If private keys must also be separate, create one App per owner and use its credentials in the corresponding ESC token entry.
The Provider structure does not need to change.

## Checks

```bash
vp check github
vp test run github/
```

## References

- [Repository definitions](./src/totto2727-org.ts)
- [Pulumi ESC gh-login](https://www.pulumi.com/docs/esc/providers/login/gh-login/)
- [Registering a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)

# Infrastructure

[totto2727-org/infra](https://github.com/totto2727-org/infra) uses TypeScript and Pulumi for AWS, Cloudflare, GitHub, and Oracle Cloud infrastructure.

- [AWS: setup and deployment](./aws/README.md)
- [Cloudflare: setup and deployment](./cloudflare/README.md)
- [GitHub: App authentication, repository adoption, and policies](./github/README.md)
- [OCI: adopt the existing Oracle ARM Orca instance](./oci-orca/README.md)

## Development

Install Node.js 24 or newer, Vite+ 1.5 or newer, pnpm 11.21.0, Pulumi CLI, and just externally.
Pulumi uses the Node.js runtime with the public Vite+ loader `--import vite-plus/register`.
Nix provides an optional development shell with `nix develop`.
Run commands from the repository root:

```bash
vp install --frozen-lockfile
vp run ci
```

CI follows the `template-vite-plus-lib` and `template-vite-plus-app` workflow pattern and runs `vp run ci` only: formatting, linting, and type checking through `check`, plus Pulumi mock tests through `test`.
These declarative Pulumi configurations do not produce a build artifact.
CI does not deploy infrastructure.

## Deployment

Complete the provider setup in the guides above and authenticate with `pulumi login`.
The `aws`, `cloudflare`, and `github` projects each use a `production` stack and a corresponding Pulumi ESC environment.
Use the [OCI production verification procedure](./oci-orca/README.md#production-verification) for the adopted instance.
Select the `production` stack in each project before using just:

```bash
pulumi stack select production --cwd aws
pulumi stack select production --cwd cloudflare
pulumi stack select production --cwd github
```

Preview the target project, review the changes, and apply manually:

```bash
just aws-preview
just aws-up

just cloudflare-preview
just cloudflare-up

just github-preview
just github-up
```

The root `Justfile` runs Pulumi in the corresponding project directory with its selected stack.

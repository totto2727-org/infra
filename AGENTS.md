# Infrastructure Development Guide

This repository manages AWS, Cloudflare, and GitHub infrastructure with TypeScript and Pulumi.

- Keep project code in `aws/`, `cloudflare/`, and `github/`.
- Use the root `package.json`, `vite.config.ts`, pnpm workspace, and `Justfile` for shared tooling.
- Use Node.js 24 or newer, externally installed Vite+ 1.5 or newer, and pnpm 11.21.0.
- Pulumi uses the Node.js runtime with the public Vite+ loader `--import vite-plus/register`.
- Run `vp run ci` from the repository root for formatting, linting, type checking, and Pulumi mock tests.
- Do not add build artifacts or deployment automation for declarative Pulumi configurations.
- Preview and deploy manually with the root Justfile after reviewing the proposed changes.
- The Pulumi projects are `aws`, `cloudflare`, and `github`, each using a `production` stack and its corresponding ESC environment.
- Keep credentials in Pulumi ESC, never in source control.
- When adopting GitHub repositories, preserve visibility and existing protection rules.

See [README.md](./README.md) for commands and the [AWS](./aws/README.md), [Cloudflare](./cloudflare/README.md), and [GitHub](./github/README.md) guides for provider authentication and setup.

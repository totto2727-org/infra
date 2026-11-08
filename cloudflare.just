default:
    @just --list --list-submodules

[working-directory: 'cloudflare']
up:
  pulumi up

[working-directory: 'cloudflare']
preview:
  pulumi preview

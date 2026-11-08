default:
    @just --list

[working-directory: 'aws']
aws-up:
  pulumi up

[working-directory: 'cloudflare']
cloudflare-up:
  pulumi up

[working-directory: 'github']
github-up:
  pulumi up

[working-directory: 'aws']
aws-preview:
  pulumi preview

[working-directory: 'cloudflare']
cloudflare-preview:
  pulumi preview

[working-directory: 'github']
github-preview:
  pulumi preview

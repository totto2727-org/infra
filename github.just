default:
    @just --list --list-submodules

[working-directory('github')]
up:
    pulumi up

[working-directory('github')]
preview:
    pulumi preview

default:
    @just --list --list-submodules

[working-directory('aws')]
up:
    pulumi up

[working-directory('aws')]
preview:
    pulumi preview

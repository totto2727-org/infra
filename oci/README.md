# OCI Infrastructure

## Prerequisites

- Install the Pulumi CLI and run `pulumi login`.
- Use the `totto2727` Pulumi organization and the `oci/production` stack.
- Run commands from the repository root.

## OCI authentication

Configure the local OCI `DEFAULT` profile for `ap-osaka-1` with an API signing key.
The OCI user needs read access to the managed resources and the private IP addresses in the subnet.
Keep the API signing key outside the repository.
See the [OCI configuration file reference](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdkconfig.htm).

## Pulumi ESC

In the `totto2727` organization, configure the ESC environment `oci/production` with the existing SSH authorized keys for the instance.
Preserve one public key per line, including any options and comments.
Keep the OCI API signing key in the local OCI profile.

```yaml
values:
  pulumiConfig:
    ociResources:sshAuthorizedKeys:
      fn::secret: |
        REPLACE_WITH_EXISTING_SSH_AUTHORIZED_KEYS
```

The tracked `oci/Pulumi.production.yaml` imports `oci/production` through its `environment` list.
Grant the preview identity permission to open this environment.

## Production verification

```bash
PULUMI_BACKEND_URL=https://api.pulumi.com pulumi preview --cwd oci \
  --stack totto2727/oci/production --refresh --diff --suppress-outputs
```

Before the common tags are applied, expect eight in-place updates covering the eight managed resources and the primary VNIC.
Each change adds five free-form tags.
Once the tags are applied, add `--expect-no-changes` to check for drift.

Use Tailscale to access the host.

## Checks

```bash
vp check oci
```

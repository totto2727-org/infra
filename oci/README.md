# OCI Infrastructure

## Prerequisites

- Install the Pulumi CLI and run `pulumi login`.
- Use the `totto2727` Pulumi organization and the `oci/production` stack.
- Run commands from the repository root.

## OCI authentication

Configure the local OCI `DEFAULT` profile with an API signing key.
The OCI user needs read access to the managed resources for a refreshed preview.
Keep the API signing key outside the repository.
See the [OCI configuration file reference](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdkconfig.htm).

## Pulumi configuration

Keep the production configuration outside the repository.
Use the `oci` namespace for provider settings and `ociResources` for resource settings.
Set `ociResources:compartmentId` to the external compartment OCID and store `ociResources:sshAuthorizedKeys` as a Pulumi secret.
The preview identity also needs permission to list the instance’s VNIC attachments and read their VNICs.
Set `OCI_PRODUCTION_CONFIG` to the path of the private production configuration file.

## Production verification

```bash
export PULUMI_BACKEND_URL=https://api.pulumi.com
umask 077
config_dir=$(mktemp -d)
config_file="$config_dir/Pulumi.production.yaml"
cp "${OCI_PRODUCTION_CONFIG:?Set OCI_PRODUCTION_CONFIG}" "$config_file"
pulumi preview --cwd oci --stack totto2727/oci/production --config-file "$config_file" \
  --refresh --diff --suppress-outputs
```

Before the common tags are applied, expect eight in-place updates covering the eight managed resources and the primary VNIC.
Each change adds five free-form tags.
Once the tags are applied, add `--expect-no-changes` to check for drift.

Use Tailscale to access the host.

## Checks

```bash
vp check oci
```

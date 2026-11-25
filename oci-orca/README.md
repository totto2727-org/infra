# Oracle ARM Orca adoption

`oci-orca` adopts the existing OCI Ampere A1 instance in Osaka as `oci:Core/instance:Instance::orca`.
The instance requires an existing OCID and enables Pulumi deletion protection.
The existing image, VCN, subnet, route table, DHCP options, internet gateway, and security list remain OCI-managed dependencies.
The OCI instance owns its primary VNIC and attachment, primary private IPv4, ephemeral public IPv4, and launch-created boot volume and attachment.
The current IPv6 assignment stays on that VNIC and is recorded by the instance importer.
Tailscale remains the normal access path for Orca.

## Rehearsal

Use a disposable `file://` backend and the local OCI CLI `DEFAULT` profile.
Set `oci:region` to `ap-osaka-1` and `oci:configFileProfile` to `DEFAULT` for the local stack.
Import the instance OCID into the disposable stack under the resource name `orca` and use its exported inputs to match the live configuration.
Store the local state and preview output outside version control with restricted permissions.

| Pulumi configuration                                                  | Source in the imported instance                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `instanceId`                                                          | Resource ID                                                                           |
| `displayName`, `availabilityDomain`, `compartmentId`, `hostnameLabel` | Same names in inputs                                                                  |
| `imageId`, `subnetId`                                                 | `sourceDetails.sourceId`, `createVnicDetails.subnetId`                                |
| `primaryPrivateIp`                                                    | `createVnicDetails.privateIp`                                                         |
| `ipv6Id`, `ipv6Address`                                               | `createVnicDetails.ipv6addressIpv6subnetCidrPairDetails[0].ipv6id` and `.ipv6address` |
| `instanceDefinedTags`, `vnicDefinedTags`                              | `definedTags`, `createVnicDetails.definedTags`                                        |
| `sshAuthorizedKeys`                                                   | `metadata.ssh_authorized_keys`                                                        |

Put the `oci-orca:*` values in the production stack's ESC configuration.
Use secret values for the private and IPv6 addresses, the two tag maps, and the SSH authorized keys.
Omit Pulumi's internal `__defaults` keys from the tag maps and preserve the SSH authorized-key string exactly.
For OCI API key authentication from ESC, use `oci:tenancyOcid`, `oci:userOcid`, `oci:fingerprint`, and the secret `oci:privateKey`.
Set the secret `oci:privateKeyPassword` if the private key is encrypted.
The production stack file sets the OCI region.

With the rehearsal configuration, an empty stack preview should show one OCI import and Pulumi stack initialization.
A preview against the locally imported instance should show zero changes.
Provider v5.8.0 records deprecated `image`, `subnetId`, and `hostnameLabel` fields during import, so the declaration supplies them alongside the current fields.
The provider's standalone `BootVolume` importer warns about missing `sourceDetails` for the launch-created disk.
The instance adoption uses the existing attachment and disk and requires no standalone boot volume registration.

## Production adoption after migration

1. Wait for item #71 to finish and verify Orca access over Tailscale.
2. Repeat the read-only OCI inventory and check the target OCID against the current Pulumi and OCI Resource Manager ownership records.
   Confirm the production stack and ESC environment before configuring the project.
3. Repeat both rehearsal previews with fresh live inputs.
   Stop if any OCI resource shows a create, update, replacement, deletion, or a second import.
4. Initialize or select `totto2727/oci-orca/production` and attach its configured ESC environment.
   Run `pulumi preview --cwd oci-orca --stack totto2727/oci-orca/production --refresh`.
   Review that the only OCI operation is the import of `orca` with the verified instance OCID.
5. After that review, run `pulumi up --cwd oci-orca --stack totto2727/oci-orca/production` and confirm the same import at the approval prompt.
   The in-code import carries deletion protection and secret output settings into the adopted state.
6. Run `pulumi preview --cwd oci-orca --stack totto2727/oci-orca/production --refresh --expect-no-changes`.
   Verify the instance OCID and Tailscale access again.

[Pulumi import documentation](https://www.pulumi.com/docs/iac/guides/migration/import/)
and [OCI Instance reference](https://www.pulumi.com/registry/packages/oci/api-docs/core/instance/).

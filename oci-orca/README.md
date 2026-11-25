# Oracle ARM Orca adoption

The `oci-orca` project adopts the existing OCI Ampere A1 instance in Osaka and its dedicated network.
Each managed resource requires its existing OCID and enables Pulumi deletion protection.
The default route table, security list, and DHCP options also use `retainOnDelete` because OCI creates them with the VCN.
Tailscale remains the normal access path for Orca.

## Ownership and import scope

The existing AWS, Cloudflare, and GitHub production stacks had no matching live OCI asset IDs or addresses.
The accessible compartment and tenancy had no OCI Resource Manager stack.
The VCN had one subnet, and the subnet had one primary private IP on the Orca instance's VNIC.
A separate state or owner outside the inspected systems must be ruled out before production adoption.

| Asset                                          | Current ownership and relationship                                                                                    | Pulumi registration                                                                                                                                                                                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VCN                                            | Dedicated to Orca, created in the OCI tenancy                                                                         | `Vcn` — `orca-vcn`; import the VCN OCID                                                                                                                                                                                                           |
| Internet gateway                               | Dedicated to the VCN; both default routes target it                                                                   | `InternetGateway` — `orca-igw`; import the gateway OCID                                                                                                                                                                                           |
| Default route table                            | OCI creates it with the dedicated VCN; its two route rules live inside the table                                      | `DefaultRouteTable` — `orca-route-table`; import its OCID once, through the default resource type                                                                                                                                                 |
| Default security list                          | OCI creates it with the dedicated VCN; the subnet uses it and the rules live inside it                                | `DefaultSecurityList` — `orca-security-list`; import its OCID once                                                                                                                                                                                |
| Default DHCP options                           | OCI creates them with the dedicated VCN; the subnet uses this option set                                              | `DefaultDhcpOptions` — `orca-dhcp`; import its OCID once                                                                                                                                                                                          |
| Subnet                                         | Dedicated to the VCN and used by the primary VNIC                                                                     | `Subnet` — `orca-subnet`; import the subnet OCID                                                                                                                                                                                                  |
| ARM instance                                   | Dedicated Compute instance launched from an OCI platform image                                                        | `Instance` — `orca`; import the instance OCID                                                                                                                                                                                                     |
| Primary VNIC and attachment                    | OCI attaches them during launch                                                                                       | `Instance.createVnicDetails` and the subnet reference cover the primary VNIC. A separate `VnicAttachment` would duplicate attachment ownership                                                                                                    |
| Primary private IPv4 and ephemeral public IPv4 | OCI assigns them to the primary VNIC, and the instance provider controls public IPv4 assignment                       | `Instance.createVnicDetails.privateIp` and `Instance.publicIp`. Individual IP imports would overlap the primary VNIC lifecycle                                                                                                                    |
| IPv6                                           | An individually addressable assignment on the primary VNIC                                                            | `Ipv6` — `orca-ipv6s`; import its OCID. The instance importer reports the address as a computed VNIC field, and the instance declaration leaves that field unset                                                                                  |
| Boot volume                                    | OCI created it from the launch image                                                                                  | The `getBootVolume` data source reads the attached disk and supplies its size and performance settings to `Instance.sourceDetails`. The standalone resource requires a clone, backup, or replica source. OCI returns no such source for this disk |
| Boot attachment                                | OCI attaches the disk during instance launch                                                                          | The `getBootVolumeAttachments` data source verifies the attached disk OCID. Provider v5.8.0 has no managed boot attachment resource                                                                                                               |
| Platform image                                 | Published and managed by Oracle                                                                                       | `Instance.sourceDetails.sourceId` references the existing image OCID                                                                                                                                                                              |
| Extra disks, NSGs, and other gateway types     | The instance has no additional volume, NSG, NAT gateway, service gateway, peering gateway, or DRG attachment in scope | No such resources to import                                                                                                                                                                                                                       |

The boot volume and boot attachment have read-only coverage.
Independent Pulumi lifecycle management for them requires provider support for an image-launched boot volume and its attachment.
For the primary VNIC and IPv4 addresses, keep the existing instance as the sole Pulumi owner.

## Rehearsal

Use a disposable `file://` backend and the local OCI CLI `DEFAULT` profile.
Set `oci:region` to `ap-osaka-1` and `oci:configFileProfile` to `DEFAULT` for the local stack.
Store the stack export and preview files outside version control with restricted permissions.
Use `pulumi import --file` in that disposable stack with the existing IDs and the exact resource names and types below.

| Resource name        | Pulumi type token                                  | Configuration for the OCID |
| -------------------- | -------------------------------------------------- | -------------------------- |
| `orca-vcn`           | `oci:Core/vcn:Vcn`                                 | `vcnId`                    |
| `orca-igw`           | `oci:Core/internetGateway:InternetGateway`         | `gatewayId`                |
| `orca-route-table`   | `oci:Core/defaultRouteTable:DefaultRouteTable`     | `routeTableId`             |
| `orca-security-list` | `oci:Core/defaultSecurityList:DefaultSecurityList` | `securityListId`           |
| `orca-dhcp`          | `oci:Core/defaultDhcpOptions:DefaultDhcpOptions`   | `dhcpOptionsId`            |
| `orca-subnet`        | `oci:Core/subnet:Subnet`                           | `subnetId`                 |
| `orca`               | `oci:Core/instance:Instance`                       | `instanceId`               |
| `orca-ipv6s`         | `oci:Core/ipv6:Ipv6`                               | `ipv6Id`                   |

For the configuration below, use the imported resources' `inputs`.
Omit internal `__defaults` keys at every level.
Use secret configuration for `networkInputs`, the primary private IP, the two tag maps, and the SSH authorized keys.
Preserve the SSH authorized-key string exactly.

| Instance or dependency configuration                                  | Source                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `displayName`, `availabilityDomain`, `compartmentId`, `hostnameLabel` | Same fields on `orca`                                        |
| `imageId`                                                             | `orca.sourceDetails.sourceId`                                |
| `primaryPrivateIp`                                                    | `orca.createVnicDetails.privateIp`                           |
| `primaryVnicId`                                                       | `orca-ipv6s.vnicId`, verified against the primary attachment |
| `bootVolumeId`                                                        | OCID of the currently attached boot volume                   |
| `instanceDefinedTags`, `vnicDefinedTags`                              | `orca.definedTags`, `orca.createVnicDetails.definedTags`     |
| `sshAuthorizedKeys`                                                   | `orca.metadata.ssh_authorized_keys`                          |

Build the secret `networkInputs` object from these fields.

| Object key                      | Fields from the matching resource                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `vcn`                           | `cidrBlocks`, `definedTags`, `displayName`, `dnsLabel`                                                     |
| `subnet`                        | `cidrBlock`, `ipv4cidrBlocks`, `ipv6cidrBlock`, `ipv6cidrBlocks`, `definedTags`, `displayName`, `dnsLabel` |
| `internetGateway`, `routeTable` | `definedTags`, `displayName` from each                                                                     |
| `securityList`                  | `definedTags`, `displayName`, `egressSecurityRules`, `ingressSecurityRules`                                |
| `dhcp`                          | `definedTags`, `displayName`, `domainNameType`, `options`                                                  |
| `ipv6`                          | `displayName`, `hostname`, `ipAddress`                                                                     |

The blank rehearsal stack preview should show eight OCI imports plus Pulumi stack initialization.
The refreshed preview against the adopted local stack should succeed with `--expect-no-changes`.
The earlier instance-only rehearsal showed one OCI import and zero changes after local import.
The instance importer records deprecated `image`, `subnetId`, and `hostnameLabel` fields, so the declaration supplies them with their current equivalents.

## Production adoption after migration

1. Wait for item 71 to finish and verify Orca access over Tailscale.
2. Repeat the read-only inventory.
   Confirm that the VCN still serves Orca alone, then check all eight OCIDs against the available ownership records.
3. Repeat both rehearsal previews with fresh OCI inventory.
   Stop if an OCI resource shows a create, update, replacement, deletion, or an import outside the table.
4. Initialize or select `totto2727/oci-orca/production` and attach the configured ESC environment.
   Supply the `oci-orca:*` settings there.
   For OCI API key authentication, use `oci:tenancyOcid`, `oci:userOcid`, `oci:fingerprint`, and the secret `oci:privateKey`.
   Set the secret `oci:privateKeyPassword` if the private key is encrypted.
   The production stack file sets the region.
5. Run `pulumi preview --cwd oci-orca --stack totto2727/oci-orca/production --refresh`.
   Confirm that all eight registrations show import operations for the verified OCIDs.
6. Run `pulumi up --cwd oci-orca --stack totto2727/oci-orca/production` and confirm the same eight imports at the approval prompt.
   The in-code imports apply deletion protection to the adopted state.
7. Run `pulumi preview --cwd oci-orca --stack totto2727/oci-orca/production --refresh --expect-no-changes`.
   Verify the instance, boot attachment, and Tailscale access again.

[Pulumi import documentation](https://www.pulumi.com/docs/iac/guides/migration/import/),
[OCI Instance reference](https://www.pulumi.com/registry/packages/oci/api-docs/core/instance/),
and [OCI BootVolume reference](https://www.pulumi.com/registry/packages/oci/api-docs/core/bootvolume/).

# Oracle ARM Orca adoption

The `oci-orca` project adopts the existing OCI Ampere A1 instance in Osaka and its dedicated network.
Each managed resource requires its existing OCID and enables Pulumi deletion protection.
The program also declares `retainOnDelete` for the default route table, security list, and DHCP options because OCI creates them with the VCN.
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
| Boot attachment                                | OCI attaches the disk during instance launch                                                                          | Provider v5.8.0 has no managed boot attachment resource                                                                                                                                                                                           |
| Platform image                                 | Published and managed by Oracle                                                                                       | `Instance.sourceDetails.sourceId` references the existing image OCID                                                                                                                                                                              |
| Extra disks, NSGs, and other gateway types     | The instance has no additional volume, NSG, NAT gateway, service gateway, peering gateway, or DRG attachment in scope | No such resources to import                                                                                                                                                                                                                       |

Independent Pulumi lifecycle management requires provider support for an image-launched boot volume and its attachment.
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

## Production verification

The production backend is Pulumi Cloud, and the stack is [`totto2727/oci-orca/production`](https://app.pulumi.com/totto2727/oci-orca/production).
Use a Pulumi account with access to the stack and a local OCI CLI `DEFAULT` profile with read access in `ap-osaka-1`.
Pulumi Cloud stores the configuration from the import, and the OCI profile supplies authentication locally.
From the repository root, recover the configuration to a private directory and run a preview.

```bash
export PULUMI_BACKEND_URL=https://api.pulumi.com
umask 077
config_dir=$(mktemp -d)
config_file="$config_dir/Pulumi.production.yaml"
pulumi config refresh --cwd oci-orca --stack totto2727/oci-orca/production --config-file "$config_file"
pulumi preview --cwd oci-orca --stack totto2727/oci-orca/production --config-file "$config_file" \
  --refresh --expect-no-changes --suppress-outputs
```

Verify that OCI reports `RUNNING` for the instance and `ATTACHED` for the connection to the original boot volume.
Verify that the host is reachable over Tailscale.

## State-only import procedure

Use this procedure for an approved adoption into an empty stack.
For the existing production stack, use the verification procedure above.

1. After migration, verify Orca access over Tailscale.
2. Confirm that the VCN still serves Orca alone, then check all eight OCIDs against the available ownership records.
3. Repeat the rehearsal and populate the target stack configuration from the same inventory.
4. Run the program preview with `--refresh` for the target stack and its configuration file.
   Confirm eight import operations for the expected OCI resources.
   Stop if the preview shows a create, update, replacement, or deletion of any OCI resource.
5. Run `pulumi import --file` with the eight-resource manifest, `--preview-only`, `--protect`, `--generate-code=false`, and `--suppress-outputs`.
   Confirm the same eight imports, then repeat the command without `--preview-only` and confirm the prompt.
6. Run the production verification procedure and confirm deletion protection for the eight OCI resources in the checkpoint.

The CLI import records deletion protection on all eight resources.
The program's `retainOnDelete` settings, dependency declarations, and additional secret output settings are outside the CLI import manifest.

[Pulumi import documentation](https://www.pulumi.com/docs/iac/guides/migration/import/),
[OCI Instance reference](https://www.pulumi.com/registry/packages/oci/api-docs/core/instance/),
and [OCI BootVolume reference](https://www.pulumi.com/registry/packages/oci/api-docs/core/bootvolume/).

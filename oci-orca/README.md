# Oracle ARM Orca adoption

The `oci-orca` project manages the existing OCI Ampere A1 instance `yachi8000` in Osaka and its dedicated network.
Each managed resource has Pulumi deletion protection.
The program also declares `retainOnDelete` for the default route table, security list, and DHCP options because OCI creates them with the VCN.
Tailscale remains the normal access path for Orca.

## Ownership

The existing AWS, Cloudflare, and GitHub production stacks had no matching live OCI asset IDs or addresses.
The accessible compartment and tenancy had no OCI Resource Manager stack.
The VCN had one subnet, and the subnet had one primary private IP on the Orca instance's VNIC.
A separate state or owner outside the inspected systems must be ruled out before production adoption.

| Asset                                          | Current ownership and relationship                                                                                    | Pulumi registration                                                                                                                                                                                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VCN                                            | Dedicated to Orca, created in the OCI tenancy                                                                         | `Vcn` — `yachi8000-vcn`                                                                                                                                                                                                                           |
| Internet gateway                               | Dedicated to the VCN; both default routes target it                                                                   | `InternetGateway` — `yachi8000-internet-gateway`                                                                                                                                                                                                  |
| Default route table                            | OCI creates it with the dedicated VCN; its two route rules live inside the table                                      | `DefaultRouteTable` — `yachi8000-default-route-table`                                                                                                                                                                                             |
| Default security list                          | OCI creates it with the dedicated VCN; the subnet uses it and the rules live inside it                                | `DefaultSecurityList` — `yachi8000-default-security-list`                                                                                                                                                                                         |
| Default DHCP options                           | OCI creates them with the dedicated VCN; the subnet uses this option set                                              | `DefaultDhcpOptions` — `yachi8000-default-dhcp-options`                                                                                                                                                                                           |
| Subnet                                         | Dedicated to the VCN and used by the primary VNIC                                                                     | `Subnet` — `yachi8000-subnet`                                                                                                                                                                                                                     |
| ARM instance                                   | Dedicated Compute instance launched from an OCI platform image                                                        | `Instance` — `yachi8000`                                                                                                                                                                                                                          |
| Primary VNIC and attachment                    | OCI attaches them during launch                                                                                       | `Instance.createVnicDetails` and the subnet reference cover the primary VNIC. A separate `VnicAttachment` would duplicate attachment ownership                                                                                                    |
| Primary private IPv4 and ephemeral public IPv4 | OCI assigns them to the primary VNIC, and the instance provider controls public IPv4 assignment                       | `Instance.createVnicDetails.privateIp` and `Instance.publicIp`. Individual IP imports would overlap the primary VNIC lifecycle                                                                                                                    |
| IPv6                                           | An individually addressable assignment on the primary VNIC                                                            | `Ipv6` — `yachi8000-ipv6`. The instance importer reports the address as a computed VNIC field, and the instance declaration leaves that field unset                                                                                               |
| Boot volume                                    | OCI created it from the launch image                                                                                  | The `getBootVolume` data source reads the attached disk and supplies its size and performance settings to `Instance.sourceDetails`. The standalone resource requires a clone, backup, or replica source. OCI returns no such source for this disk |
| Boot attachment                                | OCI attaches the disk during instance launch                                                                          | Provider v5.8.0 has no managed boot attachment resource                                                                                                                                                                                           |
| Platform image                                 | Published and managed by Oracle                                                                                       | `Instance.sourceDetails.sourceId` references the existing image OCID                                                                                                                                                                              |
| Extra disks, NSGs, and other gateway types     | The instance has no additional volume, NSG, NAT gateway, service gateway, peering gateway, or DRG attachment in scope | No such resources to import                                                                                                                                                                                                                       |

The logical resource names use aliases for the original production checkpoint names.
Independent Pulumi lifecycle management requires provider support for an image-launched boot volume and its attachment.
For the primary VNIC and IPv4 addresses, keep the existing instance as the sole Pulumi owner.

## Production configuration

| Key                                      | Purpose                                                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `compartmentId`                          | OCI compartment that owns the VCN. Other managed resources use the compartment from their parent network.               |
| `bootVolumeId`                           | Existing OCI boot volume. The data source reads its size and performance settings.                                      |
| `primaryVnicId`                          | Primary VNIC for IPv6. OCI creates the VNIC during instance launch, and the instance resource does not expose its OCID. |
| `networkInputs`                          | Secret network ranges, IPv6 address, and OCI network tag maps.                                                          |
| `primaryPrivateIp`                       | Secret private IPv4 address.                                                                                            |
| `instanceDefinedTags`, `vnicDefinedTags` | Secret OCI tag maps.                                                                                                    |
| `sshAuthorizedKeys`                      | Secret SSH authorized-key configuration.                                                                                |
| `oci:configFileProfile`                  | Local OCI authentication profile.                                                                                       |
| `oci:region`                             | Osaka region. The production stack file sets this value.                                                                |

## Production verification

The production backend is Pulumi Cloud, and the stack is [`totto2727/oci-orca/production`](https://app.pulumi.com/totto2727/oci-orca/production).
Use a Pulumi account with access to the stack and a local OCI CLI `DEFAULT` profile with read access in `ap-osaka-1`.
Pulumi Cloud stores the configuration from the last stack update.
The OCI profile supplies authentication locally.
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

[OCI Instance reference](https://www.pulumi.com/registry/packages/oci/api-docs/core/instance/),
and [OCI BootVolume reference](https://www.pulumi.com/registry/packages/oci/api-docs/core/bootvolume/).

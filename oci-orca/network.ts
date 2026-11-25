import { core } from '@pulumi/oci'
import { Config } from '@pulumi/pulumi'
import type { Unwrap } from '@pulumi/pulumi'

const config = new Config()
type Tags = Record<string, string>

interface NetworkInputs {
  vcn: {
    cidrBlocks: string[]
    definedTags: Tags
    dnsLabel: string
    displayName: string
  }
  subnet: {
    cidrBlock: string
    ipv4cidrBlocks: string[]
    ipv6cidrBlock: string
    ipv6cidrBlocks: string[]
    definedTags: Tags
    dnsLabel: string
    displayName: string
  }
  internetGateway: { definedTags: Tags; displayName: string }
  routeTable: { definedTags: Tags; displayName: string }
  securityList: Unwrap<Pick<core.DefaultSecurityListArgs, 'egressSecurityRules' | 'ingressSecurityRules'>> & {
    definedTags: Tags
    displayName: string
  }
  dhcp: Unwrap<Pick<core.DefaultDhcpOptionsArgs, 'options' | 'domainNameType'>> & {
    definedTags: Tags
    displayName: string
  }
  ipv6: { displayName: string; hostname: string; ipAddress: string }
}

const network = config.requireSecretObject<NetworkInputs>('networkInputs')
const compartmentId = config.require('compartmentId')
const vcnId = config.require('vcnId')
const gatewayId = config.require('gatewayId')
const routeTableId = config.require('routeTableId')
const securityListId = config.require('securityListId')
const dhcpOptionsId = config.require('dhcpOptionsId')
export const subnetId = config.require('subnetId')

const vcn = new core.Vcn(
  'orca-vcn',
  {
    compartmentId,
    cidrBlock: network.vcn.cidrBlocks[0],
    cidrBlocks: network.vcn.cidrBlocks,
    definedTags: network.vcn.definedTags,
    displayName: network.vcn.displayName,
    dnsLabel: network.vcn.dnsLabel,
    isIpv6enabled: true,
  },
  { import: vcnId, protect: true },
)

const gateway = new core.InternetGateway(
  'orca-igw',
  {
    compartmentId,
    vcnId,
    definedTags: network.internetGateway.definedTags,
    displayName: network.internetGateway.displayName,
  },
  { import: gatewayId, protect: true, dependsOn: [vcn] },
)

const routeTable = new core.DefaultRouteTable(
  'orca-route-table',
  {
    compartmentId,
    manageDefaultResourceId: routeTableId,
    definedTags: network.routeTable.definedTags,
    displayName: network.routeTable.displayName,
    routeRules: ['0.0.0.0/0', '::/0'].map((destination) => ({
      destination,
      destinationType: 'CIDR_BLOCK',
      networkEntityId: gatewayId,
      routeType: 'STATIC',
    })),
  },
  { import: routeTableId, protect: true, retainOnDelete: true, dependsOn: [gateway] },
)

const securityList = new core.DefaultSecurityList(
  'orca-security-list',
  {
    compartmentId,
    manageDefaultResourceId: securityListId,
    definedTags: network.securityList.definedTags,
    displayName: network.securityList.displayName,
    egressSecurityRules: network.securityList.egressSecurityRules,
    ingressSecurityRules: network.securityList.ingressSecurityRules,
  },
  { import: securityListId, protect: true, retainOnDelete: true, dependsOn: [vcn] },
)

const dhcp = new core.DefaultDhcpOptions(
  'orca-dhcp',
  {
    compartmentId,
    manageDefaultResourceId: dhcpOptionsId,
    definedTags: network.dhcp.definedTags,
    displayName: network.dhcp.displayName,
    domainNameType: network.dhcp.domainNameType,
    options: network.dhcp.options,
  },
  { import: dhcpOptionsId, protect: true, retainOnDelete: true, dependsOn: [vcn] },
)

export const subnet = new core.Subnet(
  'orca-subnet',
  {
    compartmentId,
    vcnId,
    cidrBlock: network.subnet.cidrBlock,
    ipv4cidrBlocks: network.subnet.ipv4cidrBlocks,
    ipv6cidrBlock: network.subnet.ipv6cidrBlock,
    ipv6cidrBlocks: network.subnet.ipv6cidrBlocks,
    definedTags: network.subnet.definedTags,
    displayName: network.subnet.displayName,
    dnsLabel: network.subnet.dnsLabel,
    routeTableId,
    securityListIds: [securityListId],
    dhcpOptionsId,
  },
  { import: subnetId, protect: true, dependsOn: [routeTable, securityList, dhcp] },
)

export const registerIpv6 = (instance: core.Instance) =>
  new core.Ipv6(
    'orca-ipv6s',
    {
      subnetId,
      vnicId: config.require('primaryVnicId'),
      ipAddress: network.ipv6.ipAddress,
      displayName: network.ipv6.displayName,
      hostname: network.ipv6.hostname,
      lifetime: 'EPHEMERAL',
    },
    { import: config.require('ipv6Id'), protect: true, dependsOn: [instance] },
  )

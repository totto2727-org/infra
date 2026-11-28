import { core } from '@pulumi/oci'
import type { CustomResourceOptions } from '@pulumi/pulumi'

import { config, freeformTags, oracleManagedTagPaths } from './config.ts'

export const hostname = 'yachi8000'
const network = config.requireSecretObject<{
  vcn: {
    cidrBlocks: [string, ...string[]]
  }
  subnet: {
    cidrBlock: string
    ipv6cidrBlock: string
    ipv6cidrBlocks: string[]
  }
  ipv6: { ipAddress: string }
}>('networkInputs')

const primaryVcnCidrBlock = network.vcn.cidrBlocks.apply(([cidrBlock]) => cidrBlock)
export const ipv6Address = network.ipv6.ipAddress
const protectedResourceOptions = (legacyName: string): CustomResourceOptions => ({
  aliases: [{ name: legacyName }],
  protect: true,
  ignoreChanges: oracleManagedTagPaths,
  additionalSecretOutputs: ['definedTags'],
})

const vcn = new core.Vcn(
  `${hostname}-vcn`,
  {
    compartmentId: config.require('compartmentId'),
    cidrBlock: primaryVcnCidrBlock,
    cidrBlocks: network.vcn.cidrBlocks,
    definedTags: {},
    freeformTags,
    displayName: hostname,
    dnsLabel: hostname,
    isIpv6enabled: true,
  },
  protectedResourceOptions('orca-vcn'),
)

const gateway = new core.InternetGateway(
  `${hostname}-internet-gateway`,
  {
    compartmentId: vcn.compartmentId,
    vcnId: vcn.id,
    definedTags: {},
    freeformTags,
    displayName: hostname,
  },
  protectedResourceOptions('orca-igw'),
)

const routeTable = new core.DefaultRouteTable(
  `${hostname}-default-route-table`,
  {
    compartmentId: vcn.compartmentId,
    manageDefaultResourceId: vcn.defaultRouteTableId,
    definedTags: {},
    freeformTags,
    displayName: `Default Route Table for ${hostname}`,
    routeRules: ['0.0.0.0/0', '::/0'].map((destination) => ({
      destination,
      destinationType: 'CIDR_BLOCK',
      networkEntityId: gateway.id,
      routeType: 'STATIC',
    })),
  },
  { ...protectedResourceOptions('orca-route-table'), retainOnDelete: true },
)

const securityList = new core.DefaultSecurityList(
  `${hostname}-default-security-list`,
  {
    compartmentId: vcn.compartmentId,
    manageDefaultResourceId: vcn.defaultSecurityListId,
    definedTags: {},
    freeformTags,
    displayName: `Default Security List for ${hostname}`,
    egressSecurityRules: ['0.0.0.0/0', '::/0'].map((destination) => ({
      destination,
      destinationType: 'CIDR_BLOCK',
      protocol: 'all',
    })),
    ingressSecurityRules: [
      { protocol: '1', source: primaryVcnCidrBlock, sourceType: 'CIDR_BLOCK', icmpOptions: { type: 3 } },
      { protocol: '58', source: '::/0', sourceType: 'CIDR_BLOCK', icmpOptions: { type: 2, code: 0 } },
      { protocol: '1', source: '0.0.0.0/0', sourceType: 'CIDR_BLOCK', icmpOptions: { type: 3, code: 4 } },
      ...['0.0.0.0/0', '::/0'].map((source) => ({
        protocol: '6',
        source,
        sourceType: 'CIDR_BLOCK',
        tcpOptions: { min: 22, max: 22 },
      })),
    ],
  },
  { ...protectedResourceOptions('orca-security-list'), retainOnDelete: true },
)

const dhcp = new core.DefaultDhcpOptions(
  `${hostname}-default-dhcp-options`,
  {
    compartmentId: vcn.compartmentId,
    manageDefaultResourceId: vcn.defaultDhcpOptionsId,
    definedTags: {},
    freeformTags,
    displayName: `Default DHCP Options for ${hostname}`,
    domainNameType: 'CUSTOM_DOMAIN',
    options: [
      { type: 'SearchDomain', searchDomainNames: [`${hostname}.oraclevcn.com`] },
      { type: 'DomainNameServer', serverType: 'VcnLocalPlusInternet' },
    ],
  },
  { ...protectedResourceOptions('orca-dhcp'), retainOnDelete: true },
)

export const subnet = new core.Subnet(
  `${hostname}-subnet`,
  {
    compartmentId: vcn.compartmentId,
    vcnId: vcn.id,
    cidrBlock: network.subnet.cidrBlock,
    ipv4cidrBlocks: [network.subnet.cidrBlock],
    ipv6cidrBlock: network.subnet.ipv6cidrBlock,
    ipv6cidrBlocks: network.subnet.ipv6cidrBlocks,
    definedTags: {},
    freeformTags,
    displayName: hostname,
    dnsLabel: hostname,
    routeTableId: routeTable.id,
    securityListIds: [securityList.id],
    dhcpOptionsId: dhcp.id,
  },
  protectedResourceOptions('orca-subnet'),
)

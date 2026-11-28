import { core } from '@pulumi/oci'
import type { CustomResourceOptions } from '@pulumi/pulumi'

import { freeformTags, oracleManagedTagPaths } from './config.ts'

export const hostname = 'yachi8000'
const primaryVcnCidrBlock = '10.0.0.0/24'
const protectedResourceOptions = (legacyName: string): CustomResourceOptions => ({
  aliases: [{ name: legacyName }],
  protect: true,
  ignoreChanges: oracleManagedTagPaths,
  additionalSecretOutputs: ['definedTags'],
})

const vcn = new core.Vcn(
  `${hostname}-vcn`,
  {
    compartmentId: 'ocid1.tenancy.oc1..aaaaaaaagknwu2moaztjqoxq7sh4it6wgv5kdokhwlemsyjtlbkal33wrjiq',
    cidrBlock: primaryVcnCidrBlock,
    cidrBlocks: [primaryVcnCidrBlock],
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

// The subnet uses the first /64 of the Oracle-assigned /56.
const subnetIpv6Cidr = vcn.ipv6cidrBlocks.apply((prefixes) => {
  const [prefix] = prefixes
  if (prefixes.length !== 1 || !prefix?.endsWith('/56')) throw new Error('Expected one Oracle-assigned IPv6 /56')
  return prefix.replace(/\/56$/, '/64')
})

export const subnet = new core.Subnet(
  `${hostname}-subnet`,
  {
    compartmentId: vcn.compartmentId,
    vcnId: vcn.id,
    cidrBlock: primaryVcnCidrBlock,
    ipv4cidrBlocks: [primaryVcnCidrBlock],
    ipv6cidrBlock: subnetIpv6Cidr,
    ipv6cidrBlocks: [subnetIpv6Cidr],
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

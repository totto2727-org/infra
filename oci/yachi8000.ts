import { core } from '@pulumi/oci'

import { freeformTags, protectedResourceOptions } from './config.ts'
import { hostname, subnet } from './network.ts'

const imageId = 'ocid1.image.oc1.ap-osaka-1.aaaaaaaaxxnsnjfb24bhltumwaruikf5y5u466curi7bh2rwohmljkztycaa'
const instance = new core.Instance(
  hostname,
  {
    availabilityDomain: 'hPLV:AP-OSAKA-1-AD-1',
    compartmentId: subnet.compartmentId,
    displayName: hostname,
    shape: 'VM.Standard.A1.Flex',
    shapeConfig: { ocpus: 2, vcpus: 2, memoryInGbs: 12 },
    // The provider records these legacy fields alongside their newer equivalents during import.
    hostnameLabel: hostname,
    image: imageId,
    subnetId: subnet.id,
    sourceDetails: {
      sourceType: 'image',
      sourceId: imageId,
      bootVolumeSizeInGbs: '150',
      bootVolumeVpusPerGb: '10',
    },
    createVnicDetails: {
      subnetId: subnet.id,
      displayName: hostname,
      hostnameLabel: hostname,
      definedTags: {},
      freeformTags,
    },
    definedTags: {},
    freeformTags,
    availabilityConfig: { recoveryAction: 'RESTORE_INSTANCE' },
    instanceOptions: { areLegacyImdsEndpointsDisabled: true },
    agentConfig: {
      pluginsConfigs: [
        { name: 'Oracle Java Management Service', desiredState: 'DISABLED' },
        { name: 'OS Management Hub Agent', desiredState: 'DISABLED' },
        { name: 'Management Agent', desiredState: 'DISABLED' },
        { name: 'Fleet Application Management Service', desiredState: 'DISABLED' },
        { name: 'Custom Logs Monitoring', desiredState: 'ENABLED' },
        { name: 'Compute Instance Run Command', desiredState: 'ENABLED' },
        { name: 'Compute Instance Monitoring', desiredState: 'ENABLED' },
        { name: 'Block Volume Management', desiredState: 'DISABLED' },
      ],
    },
    launchOptions: {
      bootVolumeType: 'PARAVIRTUALIZED',
      firmware: 'UEFI_64',
      isConsistentVolumeNamingEnabled: true,
      isPvEncryptionInTransitEnabled: true,
      networkType: 'PARAVIRTUALIZED',
      remoteDataVolumeType: 'PARAVIRTUALIZED',
    },
    metadata: {
      ssh_authorized_keys:
        'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOdmfQ2dZm0ry5ieimF79EcGNErSGX4XSApdOrXQe8iR openpgp:0x41B5D669',
    },
    state: 'RUNNING',
  },
  {
    ...protectedResourceOptions,
    ignoreChanges: [
      ...protectedResourceOptions.ignoreChanges,
      ...protectedResourceOptions.ignoreChanges.map((path) => `createVnicDetails.${path}`),
    ],
    additionalSecretOutputs: [
      ...protectedResourceOptions.additionalSecretOutputs,
      'createVnicDetails',
      'extendedMetadata',
      'metadata',
      'privateIp',
      'publicIp',
    ],
  },
)

const primaryIp = core.getPrivateIpsOutput({ ipAddress: instance.privateIp, subnetId: subnet.id })

new core.Ipv6(
  `${hostname}-ipv6`,
  {
    subnetId: subnet.id,
    vnicId: primaryIp.privateIps[0]!.vnicId,
    displayName: `${hostname}-ipv6`,
    hostname,
    lifetime: 'EPHEMERAL',
    freeformTags,
  },
  { protect: true, additionalSecretOutputs: ['ipAddress'] },
)

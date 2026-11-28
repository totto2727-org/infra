import { core } from '@pulumi/oci'

import { config, freeformTags, oracleManagedTagPaths } from './config.ts'
import { hostname, ipv6Address, subnet } from './network.ts'

const imageId = 'ocid1.image.oc1.ap-osaka-1.aaaaaaaaxxnsnjfb24bhltumwaruikf5y5u466curi7bh2rwohmljkztycaa'
const bootVolumeId = config.require('bootVolumeId')

const bootVolume = core.getBootVolumeOutput({ bootVolumeId })

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
      bootVolumeSizeInGbs: bootVolume.sizeInGbs,
      bootVolumeVpusPerGb: bootVolume.vpusPerGb,
    },
    createVnicDetails: {
      subnetId: subnet.id,
      displayName: hostname,
      hostnameLabel: hostname,
      privateIp: config.requireSecret('primaryPrivateIp'),
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
    metadata: { ssh_authorized_keys: config.requireSecret('sshAuthorizedKeys') },
    state: 'RUNNING',
  },
  {
    aliases: [{ name: 'orca' }],
    protect: true,
    ignoreChanges: [...oracleManagedTagPaths, ...oracleManagedTagPaths.map((path) => `createVnicDetails.${path}`)],
    additionalSecretOutputs: [
      'createVnicDetails',
      'definedTags',
      'extendedMetadata',
      'metadata',
      'privateIp',
      'publicIp',
    ],
  },
)

new core.Ipv6(
  `${hostname}-ipv6`,
  {
    subnetId: subnet.id,
    vnicId: config.require('primaryVnicId'),
    ipAddress: ipv6Address,
    displayName: 'ipv620261125161346',
    hostname,
    lifetime: 'EPHEMERAL',
    freeformTags,
  },
  { aliases: [{ name: 'orca-ipv6s' }], protect: true, dependsOn: [instance] },
)

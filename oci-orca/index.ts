import { core } from '@pulumi/oci'
import { Config } from '@pulumi/pulumi'

import { registerIpv6, subnet, subnetId } from './network.ts'

const config = new Config()
const displayName = config.require('displayName')
const compartmentId = config.require('compartmentId')
const imageId = config.require('imageId')
const instanceId = config.require('instanceId')
const availabilityDomain = config.require('availabilityDomain')
const bootVolumeId = config.require('bootVolumeId')
const hostnameLabel = config.require('hostnameLabel')

const bootVolume = core.getBootVolumeOutput({ bootVolumeId })

const instance = new core.Instance(
  'orca',
  {
    availabilityDomain,
    compartmentId,
    displayName,
    faultDomain: 'FAULT-DOMAIN-3',
    shape: 'VM.Standard.A1.Flex',
    shapeConfig: { ocpus: 2, vcpus: 2, memoryInGbs: 12 },
    // The provider records these legacy fields alongside their newer equivalents during import.
    hostnameLabel,
    image: imageId,
    subnetId,
    sourceDetails: {
      sourceType: 'image',
      sourceId: imageId,
      bootVolumeSizeInGbs: bootVolume.sizeInGbs,
      bootVolumeVpusPerGb: bootVolume.vpusPerGb,
    },
    createVnicDetails: {
      subnetId,
      displayName,
      hostnameLabel,
      privateIp: config.requireSecret('primaryPrivateIp'),
      definedTags: config.requireSecretObject<Record<string, string>>('vnicDefinedTags'),
    },
    definedTags: config.requireSecretObject<Record<string, string>>('instanceDefinedTags'),
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
    import: instanceId,
    protect: true,
    dependsOn: [subnet],
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

registerIpv6(instance)

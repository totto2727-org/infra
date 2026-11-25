import { core } from '@pulumi/oci'
import { Config } from '@pulumi/pulumi'

const config = new Config()
const displayName = config.require('displayName')
const compartmentId = config.require('compartmentId')
const imageId = config.require('imageId')
const subnetId = config.require('subnetId')
const hostnameLabel = config.require('hostnameLabel')

new core.Instance(
  'orca',
  {
    availabilityDomain: config.require('availabilityDomain'),
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
      bootVolumeSizeInGbs: '150',
      bootVolumeVpusPerGb: '10',
    },
    createVnicDetails: {
      subnetId,
      displayName,
      hostnameLabel,
      privateIp: config.requireSecret('primaryPrivateIp'),
      ipv6addressIpv6subnetCidrPairDetails: [
        { ipv6address: config.requireSecret('ipv6Address'), ipv6id: config.require('ipv6Id') },
      ],
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
    import: config.require('instanceId'),
    protect: true,
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

import { core } from '@pulumi/oci'

import { config, freeformTags, oracleManagedTagPaths } from './config.ts'
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

const attachments = core.getVnicAttachmentsOutput({ instanceId: instance.id, compartmentId: instance.compartmentId })
const primaryVnicId = attachments.vnicAttachments.apply(async (items) => {
  const attached = items.filter((item) => item.state === 'ATTACHED')
  const vnics = await Promise.all(attached.map(({ vnicId }) => core.getVnic({ vnicId })))
  const primary = vnics.filter((vnic) => vnic.isPrimary)
  if (primary.length !== 1) throw new Error(`Expected one attached primary VNIC, found ${primary.length}`)
  return primary[0]!.vnicId
})

new core.Ipv6(
  `${hostname}-ipv6`,
  {
    subnetId: subnet.id,
    vnicId: primaryVnicId,
    displayName: 'ipv620261125161346',
    hostname,
    lifetime: 'EPHEMERAL',
    freeformTags,
  },
  { aliases: [{ name: 'orca-ipv6s' }], protect: true, additionalSecretOutputs: ['ipAddress'] },
)

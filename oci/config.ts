import { Config } from '@pulumi/pulumi'

export const config = new Config('ociResources')

// OCI assigns these tags when it creates a resource. An empty definedTags map
// gives Pulumi a parent path for restoring the ignored keys from state.
export const oracleManagedTagPaths = ['definedTags["Oracle-Tags.CreatedBy"]', 'definedTags["Oracle-Tags.CreatedOn"]']

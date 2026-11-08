import * as aws from '@pulumi/aws'

const identifyStore = await aws.ssoadmin.getInstances({})

// oxlint-disable-next-line typescript/no-non-null-assertion -- restored implementation assumes the first Identity Center instance exists
export const id = identifyStore.identityStoreIds[0]!
// oxlint-disable-next-line prefer-destructuring -- preserve the restored implementation without changing its expression form
export const region = identifyStore.region
// oxlint-disable-next-line typescript/no-non-null-assertion -- restored implementation assumes the first Identity Center instance exists
export const arn = identifyStore.arns[0]!

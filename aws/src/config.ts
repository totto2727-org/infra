import * as pulumi from '@pulumi/pulumi'

const stack = pulumi.getStack()
const environmentName = stack === 'production' ? 'prod' : stack

export const resourceName = (name: string) => `iac-${environmentName}-${name}`

export const protectedResourceOptions = (legacyName: string) => ({
  aliases: [{ name: legacyName }],
  protect: true,
})

import * as pulumi from '@pulumi/pulumi'
import { Predicate } from 'effect'

// oxlint-disable-next-line typescript/no-non-null-assertion -- restored environment contract is checked immediately below
export const accountID = process.env['CLOUDFLARE_ACCOUNT_ID']!

if (Predicate.isNullish(accountID)) {
  throw new Error('required CLOUDFLARE_ACCOUNT_ID')
}

const stack = pulumi.getStack()
const environmentName = stack === 'production' ? 'prod' : stack

export const resourceName = (name: string) => `iac-${environmentName}-${name}`

export const protectedResourceOptions = (legacyName: string) => ({
  aliases: [{ name: legacyName }],
  protect: true,
})

export const accessApplicationTags = {
  environment: `environment:${stack}`,
  managedBy: 'managed-by:pulumi',
  pulumiProject: `pulumi-project:${pulumi.getProject()}`,
  pulumiStack: `pulumi-stack:${stack}`,
  repository: 'repository:totto2727-org/monorepo',
} as const

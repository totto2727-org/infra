import type { GetAccountRolesResult } from '@pulumi/cloudflare'

export const iamCatalogLimit = 1000

export function namedIamId(
  objects: readonly Pick<GetAccountRolesResult['results'][number], 'id' | 'name'>[],
  name: string,
) {
  if (objects.length >= iamCatalogLimit) {
    throw new Error(`IAM catalog reached its ${iamCatalogLimit}-item limit; cannot safely resolve ${name}`)
  }
  const matches = objects.filter((object) => object.name === name)
  const [match] = matches
  if (matches.length !== 1 || !match?.id) {
    throw new Error(`Expected exactly one IAM object with a nonempty ID named ${name}; found ${matches.length}`)
  }
  return match.id
}

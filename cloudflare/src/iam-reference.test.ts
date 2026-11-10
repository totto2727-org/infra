import { describe, expect, test } from 'vite-plus/test'

import { iamCatalogLimit, namedIamId } from './iam-reference.ts'

describe('Named IAM references', () => {
  test('selects the exact name regardless of order or ID value', () => {
    expect(
      namedIamId(
        [
          { name: 'Administrator', id: 'unrelated' },
          { name: 'Super Administrator - All Privileges', id: 'current-provider-id' },
        ],
        'Super Administrator - All Privileges',
      ),
    ).toBe('current-provider-id')
  })

  test('does not match another account scope or a partial name', () => {
    expect(() =>
      namedIamId(
        [{ name: 'com.cloudflare.api.account.other', id: 'wrong-account' }],
        'com.cloudflare.api.account.current',
      ),
    ).toThrow('found 0')
  })

  test('rejects a missing object instead of using a fallback ID', () => {
    expect(() => namedIamId([], 'Administrator')).toThrow('found 0')
  })

  test('rejects ambiguous names instead of selecting the first result', () => {
    expect(() =>
      namedIamId(
        [
          { name: 'Administrator', id: 'first' },
          { name: 'Administrator', id: 'second' },
        ],
        'Administrator',
      ),
    ).toThrow('found 2')
  })

  test('rejects a matching object without a usable ID', () => {
    expect(() => namedIamId([{ name: 'Administrator', id: '' }], 'Administrator')).toThrow('nonempty ID')
  })

  test('rejects a potentially truncated catalog even when the name was found', () => {
    const objects = Array.from({ length: iamCatalogLimit }, (_, index) => ({
      name: `Role ${index}`,
      id: `id-${index}`,
    }))
    expect(() => namedIamId(objects, 'Role 0')).toThrow('item limit')
  })
})

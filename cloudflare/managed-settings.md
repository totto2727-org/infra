# Shared Cloudflare settings

This project owns shared settings for the account and `totto2727.dev`.
The baseline adopts observed settings; the approved DNSSEC enablement is a separate change.
Resources have individual declarations, and account and Zone identifiers come from `src/config.ts`.

## Managed settings

| Module                                                                                                 | Settings                                                                                         |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `src/access-application.ts`, `src/access-group.ts`, `src/access-policy.ts`, `src/identity-provider.ts` | Existing Access applications, ownership tags, passkey group, policy and identity provider        |
| `src/ai-gateway.ts`                                                                                    | Authenticated AI Gateway with log collection disabled                                            |
| `src/account-member.ts`                                                                                | Existing accepted account member and administrator assignment                                    |
| `src/account-settings.ts`                                                                              | Account name and two-factor authentication requirement                                           |
| `src/shared-assets.ts`                                                                                 | Existing Zone and the `public` image variant                                                     |
| `src/dns.ts`                                                                                           | Independently managed DMARC TXT record                                                           |
| `src/dns-settings.ts`                                                                                  | Account DNS defaults, Zone DNS settings and schema validation defaults                           |
| `src/email-routing.ts`                                                                                 | Email Routing settings, apex/subdomain DNS controllers and catch-all rule                        |
| `src/notifications.ts`                                                                                 | Web Analytics email notification                                                                 |
| `src/zone-settings.ts`                                                                                 | Editable Zone settings, DNSSEC, URL normalization, cache, bots, managed headers and TLS settings |
| `src/zero-trust.ts`                                                                                    | Gateway logging                                                                                  |
| `src/zero-trust-settings.ts`                                                                           | Shared Gateway, DNS location, WARP, connectivity, DLP and identity settings                      |
| `src/web-analytics.ts`                                                                                 | Zone-wide Web Analytics site                                                                     |

Native API list inputs, such as policy matchers and split-tunnel networks, remain arrays.
Resources themselves are not created from configuration arrays or factories.
Email Routing owns MX, DKIM and SPF records; only the independent DMARC record is declared as a `DnsRecord`.

| Reference                                                    | Handling                                                                |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| IAM roles and permission/resource groups                     | Native data sources, exact names, unique match required                 |
| Missing/ambiguous IAM names or retrieval limit reached       | Stop; no fallback ID                                                    |
| Existing imports and centralized Zone identity               | Keep bootstrap identifiers                                              |
| Gateway certificate, DNS allocation and DMARC report address | Keep service-issued values without a stable name                        |
| IAM lookup acceptance                                        | Requires ESC account settings read access; production lookup unverified |

## Not managed

| Setting                                                                        | Reason                 |
| ------------------------------------------------------------------------------ | ---------------------- |
| AI Gateway BYOK and Custom Provider                                            | Pulumiで管理不可       |
| Budget notification threshold                                                  | Pulumiで管理不可       |
| Page Shield enablement                                                         | Pulumiで管理不可       |
| Organization trust, posture caching and end-user app creation controls         | Pulumiで管理不可       |
| Disabled service-token inactivity with null action/threshold                   | Pulumiで管理不可       |
| DNS location DNS64 and anonymized logging                                      | Pulumiで管理不可       |
| WARP advanced controls and global disconnect                                   | Pulumiで管理不可       |
| DLP validation timeout and SCIM group-member deprovisioning                    | Pulumiで管理不可       |
| Automatic SSL mode controller                                                  | Pulumiで管理不可       |
| Registrar renewal settings                                                     | Pulumiで管理不可       |
| Existing Web Analytics all-host rule                                           | 既存IDの取り込み非対応 |
| Worker bindings, custom domains, Pages sites and CNAMEs                        | 他アプリ管理           |
| Worker DNS, Email Routing mail DNS and service-issued TLS/Gateway certificates | 自動生成               |
| Cloudflare-managed ruleset catalogs and predefined network objects             | Cloudflare管理         |
| Root redirect, origin and transform ruleset bodies                             | 設定内容未取得         |
| Unavailable product configuration                                              | 未使用・調査制限       |
| `openshell.totto2727.dev` and unused Tunnels                                   | 削除候補               |

「Pulumiで管理不可」は、使用中のCloudflare provider `6.23.3`で表現できない項目です。
Unknown ruleset contents are not replaced with inferred empty rules.
URL normalization owns its backing rules, and automatic SSL management owns the current SSL mode.
Deletion candidates are excluded from adoption, not deleted by this program.

## Adoption workflow

| Resource lifecycle                                                      | Expected first preview                                                                  |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Resources with native import support                                    | Import existing identity; DNSSEC intentionally changes from disabled to active          |
| DNS, schema and device singleton settings without native import support | Create Pulumi state through the native provider's update endpoint using observed values |
| Apex/subdomain Email Routing DNS controllers                            | Configure generated mail DNS through native Create; no zone-only import for subdomains  |
| Existing Access and AI Gateway resources                                | Unchanged identities and outputs                                                        |

All declared resources use `protect: true`.
Protection blocks deletion and replacement, not in-place settings updates.
A native singleton create is an initial settings write, not a read-only import.
Email Routing DNS Create can rewrite generated mail DNS.

1. Run `vp run ci` from the repository root.
2. Run `pulumi preview --cwd cloudflare --stack totto2727/cloudflare/production --refresh=true --diff` after the token prerequisite is resolved.
3. Check every import ID and singleton create against the table above.
4. Investigate other creates, updates, deletions, replacements and input mismatches.
5. After approval, use the existing Cloudflare deployment recipe.
6. Require a clean post-deployment preview for the resources changed by the approved update.

No deployment or state import has been executed.
Direct API scripts and custom REST providers are not used.

## DNSSEC enablement

`zoneDnssec` requests `status: 'active'` for the existing `totto2727.dev` Zone, retaining its import identity and deletion protection.
No other setting is hardened by this change.
The 2026-11-10 production state export did not contain this resource, so review its initial import and status update before applying.
Do not treat the first import as an already completed deployment.

After resolving the preview blockers below, use a DNSSEC-only preview rather than applying the unrelated initial adoption changes:

```bash
pulumi preview --cwd cloudflare --stack totto2727/cloudflare/production --refresh=true --diff \
  --target 'urn:pulumi:production::cloudflare::cloudflare:index/zoneDnssec:ZoneDnssec::iac-prod-zone-dnssec'
```

The target limits resource updates, but the full program still evaluates provider data sources.
Stop if the preview cannot read the existing resource, reports an import mismatch, or proposes deletion or replacement.
Apply only the reviewed target through the same Pulumi workflow; do not run an unrestricted `up` for this change.

Cloudflare Registrar automatically publishes the parent DS record; do not declare a second DS record in this Zone.
Publication can take one to two days, so an enabled Zone setting alone does not establish a working chain of trust.
After applying, verify the parent DS against the authoritative DNSKEY, check signed A/AAAA and MX answers through validating resolvers, and require a clean DNSSEC-only preview.
If validation fails, investigate the DS and signing state rather than immediately disabling signing while a parent DS remains cached.
Production preview, application and parent DS validation remain unverified until the token prerequisite is resolved.

## Preview blockers

| Blocker                                                                                   | Required action                                                                             |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Previous adoption preview returned HTTP 403 on 40 distinct read endpoints                 | Update the existing API token in Pulumi ESC `cloudflare/production`; retain existing grants |
| Existing `repository:totto2727-org/monorepo` Access tag returned a false not-found result | Resolve the provider SDK's unescaped slash lookup; do not rename or recreate the tag        |
| Expanded native declarations have not had a successful production preview                 | Review them after the token update; local mocks do not prove cloud acceptance               |
| Email Routing DNS subdomain response is deprecated and unmodeled by the SDK               | Confirm native subdomain reconciliation during the first authorized production preview      |

The separate `cf` OAuth grant does not expand the Pulumi ESC token.

## References

- [Pulumi resource imports](https://www.pulumi.com/docs/iac/concepts/resources/options/import/)
- [Cloudflare provider resources](https://www.pulumi.com/registry/packages/cloudflare/api-docs/)
- [Cloudflare API permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)
- [Cloudflare DNSSEC activation, automatic Registrar DS publication and rollback](https://developers.cloudflare.com/dns/dnssec/)

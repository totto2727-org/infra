# Shared Cloudflare settings

This project owns account-wide settings and shared settings for `totto2727.dev`.
Worker applications and their bindings, custom domains, and generated DNS records remain in their application repositories.
The initial adoption preserves observed values and existing resource identities.
Security and privacy changes belong in a separate follow-up pull request.

## Resource ownership

| Module                                                                                                 | Ownership                                                                                                |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `src/access-application.ts`, `src/access-group.ts`, `src/access-policy.ts`, `src/identity-provider.ts` | Existing shared Access applications, tags, passkey group, policy, and identity provider                  |
| `src/ai-gateway.ts`                                                                                    | Existing authenticated AI Gateway `iac-prod-ai-gateway` with log collection disabled                     |
| `src/account-settings.ts`                                                                              | Account name and existing two-factor authentication requirement                                          |
| `src/dns.ts`                                                                                           | Shared DMARC and SPF TXT records                                                                         |
| `src/email-routing.ts`                                                                                 | Existing disabled drop catch-all, without a second owner for the same object from the rule-list endpoint |
| `src/notifications.ts`                                                                                 | Existing Web Analytics email notification                                                                |
| `src/zone-settings.ts`                                                                                 | Supported editable Zone settings and shared security settings, using their existing values               |
| `src/zero-trust.ts`                                                                                    | Supported shared Zero Trust settings                                                                     |
| `src/web-analytics.ts`                                                                                 | Zone-wide Web Analytics site, excluding Pages-owned sites                                                |

Newly adopted resources use explicit `import` IDs and `protect: true`.
Existing Access and AI Gateway resources keep their logical names and outputs.
URL normalization has one owner: the normalization settings resource, not its backing managed ruleset.
Automatic SSL mode remains authoritative for the observed SSL mode, so the program does not compete by setting `ssl` separately.

## Manual exceptions

These settings remain in place outside Pulumi until the installed provider can preserve them safely.
Do not create replacements to work around an unsupported import or an incomplete input model.

| Setting                               | Current ownership and limitation                                                                                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI Gateway BYOK                       | Existing `openai` and `opencode-go` key registrations remain manual. Keep key material in its existing secret store, never in Git.                                                                              |
| AI Gateway Custom Provider            | Existing OpenCode Go definition remains manual. Provider `6.23.3` has no corresponding independent resource.                                                                                                    |
| Email Routing enablement and mail DNS | Existing apex and `email.totto2727.dev` enablement, MX, and DKIM remain service-owned. No `EmailRoutingDns` resource also owns the independently declared SPF records.                                          |
| Budget notification                   | Existing USD 10 threshold remains manual. Provider `6.23.3` cannot represent its `total_spend_dollars` filter.                                                                                                  |
| One-time PIN identity provider        | Existing identity provider remains unchanged. Do not approximate its unrepresented configuration with an empty object.                                                                                          |
| Page Shield settings                  | Existing enablement remains manual. A policy resource is not a replacement for the settings object.                                                                                                             |
| API Schema default mitigation         | Preserve `none` manually. `SchemaValidationSettings` does not support import in the installed provider.                                                                                                         |
| Web Analytics rule                    | Existing all-host and all-path auto-install rule remains in place. `WebAnalyticsRule` does not support import.                                                                                                  |
| Zero Trust organization and trust     | Existing disabled inactivity enforcement contains null action and threshold, which provider `6.23.3` cannot preserve with its required non-null inputs. Organization trust has no corresponding writable input. |
| Account and Zone DNS settings         | These are separate from individual DNS records and do not support import in the installed provider.                                                                                                             |

## Excluded resources

- Workers, bindings, KV, D1, R2, Durable Objects, Containers, Cron, and Secrets remain application-owned.
- Worker-generated DNS and TLS, Pages custom domains and CNAMEs, and Flowdeck's application declarations are not duplicated here.
- Cloudflare-managed ruleset catalogs are not user-owned rulesets.
- Rulesets without a complete, verified rule representation are not reconstructed from metadata.
- The `openshell` Tunnel DNS reference, account mTLS certificate, and Images variant remain unchanged while their ownership is unresolved.
- Default network objects, predefined catalogs, unused products, registration lifecycle, billing, and contracts are outside adoption scope.

## Adopt without changing settings

1. Run `vp run ci` from the repository root.
2. Run `pulumi preview --cwd cloudflare --stack totto2727/cloudflare/production --refresh=true --diff`.
3. Require imports and unchanged resources only. Investigate any create, update, delete, replacement, missing resource, or input mismatch before proceeding.
4. Review each import ID against the existing account or Zone resource.
5. After approval, run the existing Cloudflare deployment recipe to record the imports in state.
6. Preview again and require no resource changes before applying a follow-up policy change.

A preview does not complete an import.
This workflow does not authorize automatic deployment from CI.
The investigation's `cf` OAuth authorization and the Pulumi ESC provider token are separate credentials.
Additional `cf` Read grants do not expand the Pulumi token's permissions.

## Preview prerequisites

The integrated adoption preview reached Cloudflare but failed with HTTP 403 on 40 distinct read endpoints using the Pulumi ESC provider token.
The remaining resources are not verified merely because their errors did not appear before the preview stopped.
Update the existing token in `cloudflare/production` with resource-specific Read access before repeating the production preview.
Keep the existing Access and AI Gateway grants, and do not substitute the investigation's separate `cf` OAuth credential.

A baseline refresh also reported the existing `repository:totto2727-org/monorepo` Access tag as missing and proposed creating it again.
A live tag listing confirmed that the tag exists and is attached to both applications.
The provider's SDK places the slash in the tag name into the lookup URL without escaping it, consistent with the false not-found result.
Do not recreate, rename, or remove this tag to make the preview pass.
Resolve the provider lookup issue before accepting a refresh preview or recording the adoption in state.

## References

- [Pulumi resource imports](https://www.pulumi.com/docs/iac/concepts/resources/options/import/)
- [Cloudflare provider resources](https://www.pulumi.com/registry/packages/cloudflare/api-docs/)
- [Cloudflare API permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)

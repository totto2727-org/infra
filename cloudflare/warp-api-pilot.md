# Single-host WARP API pilot

Use this runbook to test credential injection from one enrolled Cloudflare One Client to two existing APIs.
The [disabled Gateway API templates](./warp-api-pilot.rules.json) are outside the Pulumi program so credential values stay out of infrastructure state and previews.
The pilot uses Gateway HTTP Allow with `rule_settings.set_headers` to overwrite the two authentication headers. [Cloudflare header operations](https://developers.cloudflare.com/cloudflare-one/traffic-controls/http-policies/tenant-control/)

| Destination                       | Request                                                                                                                  | Authentication                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Self-hosted OpenConnector         | `GET https://open-connector.totto2727.workers.dev/v1/actions`                                                            | `Authorization` with a dedicated OpenConnector runtime token                                                                         |
| Existing authenticated AI Gateway | `POST https://gateway.ai.cloudflare.com/v1/5643a837ef66765e7881c0831a36ebed/iac-prod-ai-gateway/openai/chat/completions` | `cf-aig-authorization` with a dedicated AI Gateway Run token and the selected existing OpenAI BYOK alias for upstream authentication |

The OpenConnector request reads the action catalog.
The rule excludes action execution, MCP, the console, admin APIs, and OAuth routes.
The hostname is the current deployed upstream and differs from the planned custom hostname in the Access application.
Verify the runtime origin again before the pilot. [OpenConnector runtime authentication](https://openconnector.io/docs/authentication/)

The AI rule targets a provider-native path and leaves any provider `Authorization` header intact.
Use the existing OpenAI provider key for the keyless probe and restrict the AI Gateway Run token to the specified Cloudflare account.
Cloudflare scopes AI Gateway Run tokens to an account, and the Gateway policy imposes the narrower path restriction.
The template disables Unified Billing fallback and skips AI Gateway log collection and the cache for the pilot request. [Provider-native authentication](https://developers.cloudflare.com/ai-gateway/configuration/authentication/) · [Provider credentials and Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/)

## Prerequisites

1. The operator installs and enrolls the Cloudflare One Client on the test host with a named identity.
   Get the verified enrollment email and the ID of a passed device posture check that can match only that host.
   Use a host-specific managed client certificate check with the private-key check enabled or an existing device attestation that verifies this single host.
   Confirm that the same identity on another device fails the check.
   Keep both positive selectors in each Allow rule. [Client certificate posture check](https://developers.cloudflare.com/cloudflare-one/reusable-components/posture-checks/client-checks/client-certificate/)
2. Use Traffic and DNS mode and a device profile scoped to the test host.
   Route only the two exact hostnames through the pilot profile with Split Tunnels in Include mode.
   Domain entries route by resolved IP, and other Cloudflare hostnames can share those IPs.
   Confirm that the pilot setup limits inspection to the two hostnames even when other names share an IP.
   Check DNS and TLS for each hostname and confirm that the HTTP client trusts the Gateway CA. [Domain-based Split Tunnels](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/configure/route-traffic/split-tunnels/) · [TLS decryption](https://developers.cloudflare.com/cloudflare-one/traffic-controls/http-policies/tls-decryption/)
3. Check live Gateway configuration, HTTP/Network/DNS rules, inherited policies where applicable, and all traffic sources.
   The production stack declares account-wide TLS decryption disabled, and the last read-only API check also returned disabled.
   Enablement requires the Gateway proxy for the pilot transport, its trusted CA, and HTTPS inspection for path matching and header injection.
   If TLS inspection is disabled, use an approved isolated Zero Trust test environment or obtain account-owner approval for a TLS change after proving that inspection is limited to the two pilot destinations on the one host.
   Keep the rules disabled if this scope cannot be guaranteed.
   An account-wide TLS toggle or a catch-all Do Not Inspect policy can change behavior for other traffic.
4. Confirm the account and an approved existing OpenAI BYOK alias through AI Gateway settings.
   Test upstream authentication separately through an approved path.
   Obtain a short-lived or promptly revocable runtime token with the minimum permissions for catalog discovery, and a dedicated AI Gateway Run token.
   Keep the tokens in the approved secret manager until the logging checks below pass.
   Keep origin authentication and existing Access policies in force.

## Stage and apply

1. In Zero Trust, go to **Traffic policies → Firewall policies → HTTP**.
   Create the three rules in the template as disabled rules via the dashboard or the [Gateway Rules API](https://developers.cloudflare.com/api/resources/zero_trust/subresources/gateway/subresources/rules/methods/create/).
   Replace the email, posture ID, and BYOK alias placeholders.
   Use a distinct, inert canary string in each Bearer value during staging.
   The precedence numbers represent relative order.
   Place both Allows ahead of the endpoint Block while preserving existing restrictions.
   A preceding Allow can skip the pilot Block, and Do Not Inspect runs before HTTP Allow and Block regardless of their precedence.
   Stop if any existing policy can bypass the endpoint guard or if either Allow would override an existing security decision. [Gateway order of enforcement](https://developers.cloudflare.com/cloudflare-one/traffic-controls/order-of-enforcement/)
2. After the TLS and routing checks, enable the Block before the Allows.
   Verify the Block on each exact path before enabling the canary Allows.
   The Block also covers other methods and query strings for those paths.
   Enable the canary Allows one at a time and confirm matching by rule ID and HTTP log metadata.
   Verify that non-HTTPS requests, other paths, a different Gateway, and missing or failed posture never match an Allow.
   Check alternate host headers, redirects, and unintended HTTP targets with the inert values only.
   Require these requests to miss both Allows.
3. Check Gateway request logs and Logpush, Cloudflare policy-change audit records and exports, origin and provider logs, and header or payload capture.
   Gateway HTTP Logpush documents `SetHeaders` as header names.
   That field does not establish what the audit records or other sinks store.
   Confirm with the account owner that rule writes and traffic on this path keep both credential values out of logs.
   Use the canary values for this check and keep real credentials out if any sink records the values or its behavior remains unverified. [Gateway HTTP log fields](https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/account/gateway_http/) · [Account audit log schema](https://developers.cloudflare.com/api/resources/audit_logs/methods/list/)
4. After the checks pass, replace the exact two inert Bearer values in the approved Cloudflare control-plane workflow.
   The Gateway rule API represents these values as literal strings.
   Limit access to policy reads and writes because the rule configuration can expose those strings.
   Keep values out of Git, Pulumi and Terraform configuration, state, plans, command arguments, console output, stored request bodies, and shell traces.
   If an approved workflow cannot meet these requirements, leave credential injection unprovisioned.

## Verify and remove

Use the same requests from the pilot host, a device without passing posture, and off WARP.
Run only a catalog read and one minimal inference with synthetic text on the approved model.
Use the curl defaults for TLS certificate verification and redirect handling.

```sh
curl --disable --noproxy '*' --silent --show-error --max-time 15 --output /dev/null \
  --write-out 'OpenConnector HTTP %{http_code}\n' \
  'https://open-connector.totto2727.workers.dev/v1/actions'
curl --disable --noproxy '*' --silent --show-error --max-time 30 --output /dev/null \
  --write-out 'AI Gateway HTTP %{http_code}\n' \
  --json '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Reply OK."}],"max_tokens":4}' \
  'https://gateway.ai.cloudflare.com/v1/5643a837ef66765e7881c0831a36ebed/iac-prod-ai-gateway/openai/chat/completions'
```

- On the pilot host, require a successful upstream response and a match on the corresponding Allow.
  For the successful probes, omit `--output /dev/null` and `--write-out` and pipe the catalog body through `jq -e '(.data | type) == "array"'`.
  Pipe the inference body through `jq -e '(.choices[0].message.content | type) == "string"'`.
  Keep only the resulting status and shape checks.
- On a Gateway-connected device without passing posture, require the endpoint Block when HTTPS is inspected.
  If the path is outside inspection or off WARP, require the upstream to reject the unauthenticated request.
- From the pilot host, check that an unapproved OpenConnector path, an altered AI Gateway ID, and requests with an unexpected method or query do not match either Allow.
  Confirm there is no injection on HTTP, any redirect destination, or unrelated traffic.
- Disable the two Allows at the end of the test or immediately if a check fails.
  Revoke both pilot tokens, delete the three pilot rules, and remove any pilot-only device profile and posture check.
  Revert approved pilot TLS changes through their reviewed configuration path.
  Repeat the unauthenticated requests and confirm upstream rejection.

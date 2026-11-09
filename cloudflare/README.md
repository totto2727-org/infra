# Cloudflare Infrastructure

## Prerequisites

- Cloudflare: API token creation for account `5643a837ef66765e7881c0831a36ebed`.
- Commands: run from the repository root.
- [Managed settings and adoption boundaries](./managed-settings.md).

## 1. API Token Permissions

Cloudflare Console → **My Profile → API Tokens → Create Token → Custom token**:

| Scope   | Permission                                            | Level |
| ------- | ----------------------------------------------------- | ----- |
| Account | Access: Organizations, Identity Providers, and Groups | Edit  |
| Account | Access: Apps and Policies                             | Edit  |
| Account | AI Gateway                                            | Edit  |

These permissions cover the existing Access and AI Gateway resources.
Adoption also needs read access to the declared account settings, notifications, Zero Trust settings, Web Analytics site, DNS records, Email Routing rule, and Zone settings.
Grant the corresponding edit permissions only for reviewed updates.
Scope Zone permissions to `totto2727.dev`, and keep account permissions scoped to this account.
Use the [Cloudflare permission reference](https://developers.cloudflare.com/fundamentals/api/reference/permissions/) to select the resource-specific permissions.

**Account Resources → Include → Specific account**: `5643a837ef66765e7881c0831a36ebed`.

## 2. Pulumi ESC

### cloudflare/production

Pulumi Console → **ESC → `cloudflare/production`**: replace `dummy-cloudflare-api-token` with the created token.

```yaml
values:
  cloudflare:
    CLOUDFLARE_API_TOKEN:
      fn::secret: dummy-cloudflare-api-token
    CLOUDFLARE_ACCOUNT_ID: 5643a837ef66765e7881c0831a36ebed
  environmentVariables:
    CLOUDFLARE_ACCOUNT_ID: ${cloudflare.CLOUDFLARE_ACCOUNT_ID}
  pulumiConfig:
    cloudflare:apiToken: ${cloudflare.CLOUDFLARE_API_TOKEN}
```

## 3. Deploy

For initial adoption, follow [Adopt without changing settings](./managed-settings.md#adopt-without-changing-settings) before running `up`.
A `cf` OAuth grant does not change the API token in Pulumi ESC.

Select the production stack, preview the changes, and apply only after review:

```bash
pulumi stack select production --cwd cloudflare
just cloudflare-preview
just cloudflare-up
```

## Checks

```bash
vp check cloudflare
vp test run cloudflare
```

## References

- [Cloudflare token permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)

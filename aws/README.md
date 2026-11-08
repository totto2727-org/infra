# AWS Infrastructure

## Prerequisites

- Pulumi CLI: `brew install pulumi` → `pulumi login`.
- Pulumi organization `totto2727`: stacks and ESC environments.
- AWS: IAM OIDC provider and role management in the deployment account.
- IAM Identity Center: enabled in `ap-northeast-1`.
- `<AWS_ACCOUNT_ID>`: deployment account's 12-digit ID.
- Commands: run from the repository root.

## 1. IAM Setup

### OIDC Provider

AWS Console → **IAM → Identity providers → Add provider**:

| Field    | Value                         |
| -------- | ----------------------------- |
| Type     | OpenID Connect                |
| URL      | `https://api.pulumi.com/oidc` |
| Audience | `aws:totto2727`               |

Provider → **Endpoint verification → Thumbprints → Manage**: `06b25927c42a721631c1efd9431e648fa62e1e39`.

### Role `iac-prod-pulumi`

AWS Console → **IAM → Roles → Create role → Custom trust policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/api.pulumi.com/oidc"
      },
      "Condition": {
        "StringEquals": {
          "api.pulumi.com/oidc:aud": "aws:totto2727"
        }
      }
    }
  ]
}
```

**Permissions policies**:

- `AWSOrganizationsFullAccess`
- `AWSSSODirectoryAdministrator`
- `AWSSSOMasterAccountAdministrator`
- `AmazonS3FullAccess`
- `IAMFullAccess`

**Role name**: `iac-prod-pulumi`.

## 2. Pulumi ESC

### aws/production

Pulumi Console → **ESC → `aws/production`**:

```yaml
values:
  aws:
    login:
      fn::open::aws-login:
        oidc:
          duration: 1h
          roleArn: arn:aws:iam::<AWS_ACCOUNT_ID>:role/iac-prod-pulumi
          sessionName: pulumi-environments-session
  environmentVariables:
    AWS_ACCESS_KEY_ID: ${aws.login.accessKeyId}
    AWS_SECRET_ACCESS_KEY: ${aws.login.secretAccessKey}
    AWS_SESSION_TOKEN: ${aws.login.sessionToken}
```

## 3. Import IAM Resources

**Unmanaged resources only**:

```bash
pulumi import --cwd aws --stack production --generate-code=false \
  aws:iam/openIdConnectProvider:OpenIdConnectProvider iac-prod-pulumi-oidc \
  'arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/api.pulumi.com/oidc'
pulumi import --cwd aws --stack production --generate-code=false \
  aws:iam/role:Role iac-prod-pulumi iac-prod-pulumi
```

## 4. Deploy

Select the production stack, preview the changes, and apply only after review:

```bash
pulumi stack select production --cwd aws
just aws::preview
just aws::up
```

## Checks

```bash
vp check aws
```

## References

- [IAM source](./src/provider.ts)
- [AWS OIDC provider setup](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [Pulumi ESC AWS setup](https://www.pulumi.com/docs/esc/guides/configuring-oidc/aws/)

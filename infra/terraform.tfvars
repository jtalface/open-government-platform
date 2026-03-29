# Non-secret defaults for this project. If you already applied once, keep subnet CIDRs
# identical to what is in state / AWS — do not change casually.

aws_region            = "af-south-1"
project_name          = "ogp"
domain_name           = "beiraewawa.com" # metadata only today; custom DNS is in Route53/GoDaddy + ACM

vpc_cidr              = "10.0.0.0/16"
public_subnets        = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets       = ["10.0.11.0/24", "10.0.12.0/24"]
db_subnets            = ["10.0.21.0/24", "10.0.22.0/24"]

db_username           = "ogp_admin"
db_password_ssm_param = "/ogp/prod/db/password" # SSM SecureString path, not the password itself

# CloudFront HTTPS hostnames — ACM must be in us-east-1 (same cert you validated in GoDaddy).
# Get ARN: aws acm list-certificates --region us-east-1 --query "CertificateSummaryList[].[DomainName,CertificateArn]" --output table
cloudfront_aliases = [
  "www.beiraewawa.com",
  "beiraewawa.com",
  "www.beiraewawa.org",
  "beiraewawa.org",
]
# Paste your production cert ARN (us-east-1). Do not leave empty while aliases are set, or plan will fail the precondition.
cloudfront_acm_certificate_arn = "arn:aws:acm:us-east-1:378788317743:certificate/ad979be9-aea0-44aa-b198-14b28f89e366"

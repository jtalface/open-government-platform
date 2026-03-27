variable "aws_region" {
  type = string
}

variable "project_name" {
  type = string
}

variable "domain_name" {
  type = string
} # e.g. app.example.com

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnets" {
  type = list(string)
} # CIDRs

variable "private_subnets" {
  type = list(string)
}

variable "db_subnets" {
  type = list(string)
}

variable "db_username" {
  type = string
}

variable "db_password_ssm_param" {
  type = string
} # SSM param path

# CloudFront custom domains (ACM must be in us-east-1 — CloudFront requirement)
variable "cloudfront_aliases" {
  type        = list(string)
  default     = []
  description = "Alternate domain names (CNAMEs) for the app distribution, e.g. www.example.com. Leave empty to use *.cloudfront.net only."
}

variable "cloudfront_acm_certificate_arn" {
  type        = string
  default     = ""
  description = "ACM certificate ARN in us-east-1 covering all cloudfront_aliases. Required if cloudfront_aliases is non-empty."
}

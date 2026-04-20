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

variable "ses_from_email" {
  type        = string
  description = "Verified SES sender email stored in SSM."
}

variable "whatsapp_access_token" {
  type        = string
  sensitive   = true
  description = "Meta WhatsApp Cloud API access token stored in SSM."
}

variable "whatsapp_phone_number_id" {
  type        = string
  description = "Meta WhatsApp Cloud API phone number ID stored in SSM."
}

variable "whatsapp_verify_token" {
  type        = string
  sensitive   = true
  description = "Webhook verify token for Meta WhatsApp callbacks stored in SSM."
}

variable "whatsapp_api_version" {
  type        = string
  default     = "v21.0"
  description = "Meta Graph API version used for WhatsApp Cloud API."
}

variable "meta_app_secret" {
  type        = string
  sensitive   = true
  description = "Meta app secret used for webhook signature validation, stored in SSM."
}

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

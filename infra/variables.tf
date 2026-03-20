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

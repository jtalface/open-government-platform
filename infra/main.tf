locals {
  name = var.project_name
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "${local.name}-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
}

resource "aws_subnet" "public" {
  for_each = toset(var.public_subnets)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value
  availability_zone       = data.aws_availability_zones.available.names[index(var.public_subnets, each.value) % length(data.aws_availability_zones.available.names)]
  map_public_ip_on_launch = true
  tags = {
    Name = "${local.name}-public-${each.value}"
  }
}

resource "aws_subnet" "private" {
  for_each = toset(var.private_subnets)
  vpc_id     = aws_vpc.main.id
  cidr_block = each.value
  availability_zone = data.aws_availability_zones.available.names[index(var.private_subnets, each.value) % length(data.aws_availability_zones.available.names)]
  tags = {
    Name = "${local.name}-private-${each.value}"
  }
}

resource "aws_subnet" "db" {
  for_each = toset(var.db_subnets)
  vpc_id     = aws_vpc.main.id
  cidr_block = each.value
  availability_zone = data.aws_availability_zones.available.names[index(var.db_subnets, each.value) % length(data.aws_availability_zones.available.names)]
  tags = {
    Name = "${local.name}-db-${each.value}"
  }
}


# Security groups
resource "aws_security_group" "alb" {
  name   = "${local.name}-alb-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "app" {
  name   = "${local.name}-app-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "db" {
  name   = "${local.name}-db-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ALB
resource "aws_lb" "app" {
  name               = "${local.name}-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = [for s in aws_subnet.public : s.id]
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_target_group" "app" {
  name     = "${local.name}-tg"
  port     = 4000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path    = "/"
    matcher = "200-399"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# IAM role for EC2 (access SSM/S3/logs)
resource "aws_iam_role" "ec2_role" {
  name = "${local.name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "s3" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "cw" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# SES: send from verified identities (used by notify-category email)
resource "aws_iam_role_policy" "ec2_ses_send" {
  name = "${local.name}-ec2-ses-send"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ses:SendEmail",
        "ses:SendRawEmail",
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name}-instance-profile"
  role = aws_iam_role.ec2_role.name
}

# Launch Template + Auto Scaling Group
data "aws_ssm_parameter" "db_password" {
  name = var.db_password_ssm_param
}

resource "aws_launch_template" "app" {
  name_prefix   = "${local.name}-lt-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = "t3.small"

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  network_interfaces {
    security_groups = [aws_security_group.app.id]
  }

  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    project_name     = local.name
    repo_url         = "https://github.com/jtalface/open-government-platform.git"
    rds_endpoint     = aws_db_instance.postgres.address
    env_file_ssm_key = "/${local.name}/.env"      # optional: or individual params
  }))
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_autoscaling_group" "app" {
  name                      = "${local.name}-asg"
  min_size                  = 2
  max_size                  = 4
  desired_capacity          = 2
  vpc_zone_identifier       = [for s in aws_subnet.private : s.id]
  health_check_type         = "EC2"
  health_check_grace_period = 60

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.app.arn]
}


# 3. RDS PostgreSQL
resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db-subnets"
  subnet_ids = [for s in aws_subnet.db : s.id]
}

resource "aws_db_instance" "postgres" {
  identifier        = "${local.name}-db"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = "db.t3.micro"
  allocated_storage = 20

  username = var.db_username
  password = data.aws_ssm_parameter.db_password.value

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  multi_az               = false

  skip_final_snapshot = true
}

# 4. S3 bucket for uploads/static
resource "aws_s3_bucket" "uploads" {
  bucket = "${local.name}-uploads-${data.aws_caller_identity.current.account_id}-${var.aws_region}"
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 5. CloudFront in front of ALB
resource "aws_cloudfront_distribution" "app" {
  enabled             = true
  comment             = "${local.name} distribution"
  default_root_object = ""

  origin {
    domain_name = aws_lb.app.dns_name
    origin_id   = "alb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "alb-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Host"]
      cookies {
        forward = "all"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Get account info (optional, useful later)
data "aws_caller_identity" "current" {}

# ---------- Route tables ----------
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "${local.name}-public-rt" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

# ---------- NAT Gateway ----------
resource "aws_eip" "nat" {
  domain = "vpc"
  tags = { Name = "${local.name}-nat-eip" }
}

# Put NAT in one public subnet (cost-optimized single NAT)
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = values(aws_subnet.public)[0].id
  tags = { Name = "${local.name}-nat" }

  depends_on = [aws_internet_gateway.igw]
}

# ---------- Private route table ----------
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "${local.name}-private-rt" }
}

resource "aws_route" "private_nat" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main.id
}

resource "aws_route_table_association" "private" {
  for_each       = aws_subnet.private
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private.id
}

# ---------- DB route table (no internet route) ----------
resource "aws_route_table" "db" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "${local.name}-db-rt" }
}

resource "aws_route_table_association" "db" {
  for_each       = aws_subnet.db
  subnet_id      = each.value.id
  route_table_id = aws_route_table.db.id
}

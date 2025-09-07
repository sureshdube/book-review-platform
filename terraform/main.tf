terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = "us-east-1"
  profile = "aiAssignment"
}

# --- Vars ---
variable "free_tier_instance_type" {
  description = "Free-tier eligible instance type"
  type        = string
  default     = "t3.micro" # change to t3.micro only if your account shows it as free-tier-eligible
}

variable "ssh_cidr" {
  description = "CIDR allowed to SSH (tighten this to your IP)"
  type        = string
  default     = "0.0.0.0/0"
}

# --- Security Group (provider v5 style: rules as separate resources) ---
resource "aws_security_group" "bookreview_sg" {
  name        = "bookreview-sg"
  description = "Allow HTTP, HTTPS, SSH, backend and frontend ports"
  # vpc_id    = data.aws_vpc.default.id  # uncomment + add data source if your account has no default VPC
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.bookreview_sg.id
  cidr_ipv4         = var.ssh_cidr
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"
  description       = "SSH"
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.bookreview_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
  description       = "HTTP"
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.bookreview_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "HTTPS"
}

resource "aws_vpc_security_group_ingress_rule" "backend_3000" {
  security_group_id = aws_security_group.bookreview_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 3000
  to_port           = 3000
  ip_protocol       = "tcp"
  description       = "Backend"
}

resource "aws_vpc_security_group_ingress_rule" "frontend_5173" {
  security_group_id = aws_security_group.bookreview_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 5173
  to_port           = 5173
  ip_protocol       = "tcp"
  description       = "Frontend (Vite)"
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.bookreview_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "All egress"
}

# --- Latest Ubuntu 22.04 x86_64 (no SSM) ---
data "aws_ami" "ubuntu_22_04_amd64" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }

  filter {
    name   = "image-type"
    values = ["machine"]
  }
}

# --- EC2 instance (Free Tier) ---
resource "aws_instance" "bookreview" {
  ami                    = data.aws_ami.ubuntu_22_04_amd64.id
  instance_type          = var.free_tier_instance_type   # default t2.micro
  key_name               = "bookreviewAssignment"        # must exist in us-east-1
  vpc_security_group_ids = [aws_security_group.bookreview_sg.id]

  user_data = <<-EOF
    #!/bin/bash
    set -e
    apt-get update -y
    apt-get install -y docker.io git
    systemctl enable --now docker

    git clone https://github.com/sureshdube/book-review-platform.git /opt/book-review-platform

    cd /opt/book-review-platform/backend
    docker build -t bookreview-backend .
    # Ensure /opt/book-review-platform/backend/.env exists or remove --env-file
    docker run -d --name bookreview-backend -p 3000:3000 --env-file .env bookreview-backend || true

    cd /opt/book-review-platform/frontend
    docker build -t bookreview-frontend .
    docker run -d --name bookreview-frontend -p 80:80 bookreview-frontend || true
  EOF

  tags = { Name = "bookreview-ec2" }
}

# --- Outputs ---
output "selected_ubuntu_ami" {
  value       = data.aws_ami.ubuntu_22_04_amd64.id
  description = "Ubuntu 22.04 x86_64 AMI ID"
}

output "ec2_public_ip" {
  value       = aws_instance.bookreview.public_ip
  description = "Public IP of the Book Review EC2 instance"
}

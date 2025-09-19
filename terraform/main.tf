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

variable "ec2_recreate_trigger" {
  description = "Change this value to force EC2 recreation and re-run user_data"
  type        = string
  default     = "initial-16"
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
  user_data_replace_on_change = true

  user_data = <<-EOF
#!/bin/bash
# Trigger: ${var.ec2_recreate_trigger}
set -e
exec > /var/log/user-data.log 2>&1

# Remove old Docker if present
apt-get remove -y docker docker-engine docker.io containerd runc || true

# Install dependencies
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker’s official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker apt repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y

# Install Docker and Docker Compose plugin
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git

systemctl enable --now docker

# Clone or update the latest code
if [ -d /opt/book-review-platform/.git ]; then
  cd /opt/book-review-platform
  git fetch --all
  git reset --hard origin/main
else
  git clone https://github.com/sureshdube/book-review-platform.git /opt/book-review-platform
  cd /opt/book-review-platform
fi

# Remove old containers and images
docker compose down --remove-orphans || true
docker rm -f $(docker ps -aq) || true
docker system prune -af -f || true

# Optional: Set VITE_API_BASE dynamically for frontend
echo "VITE_API_BASE=\"http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000\"" | tee frontend/.env frontend/.env.production > /dev/null

# Build and start all services fresh
docker compose build --no-cache
docker compose up -d
EOF

  lifecycle {
    create_before_destroy = true
  }

  metadata_options {
    http_tokens = "optional"
  }

  tags = {
    Name = "bookreview-ec2"
    Recreate_Trigger = var.ec2_recreate_trigger
  }
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

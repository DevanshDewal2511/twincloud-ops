variable "environment_name" {
  type        = string
  default     = "twincloud-prod"
  description = "Prefix for AWS resources"
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "Primary AWS region"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "VPC CIDR block"
}

variable "public_subnet_1_cidr" {
  type        = string
  default     = "10.0.1.0/24"
  description = "Public Subnet 1 CIDR"
}

variable "public_subnet_2_cidr" {
  type        = string
  default     = "10.0.2.0/24"
  description = "Public Subnet 2 CIDR"
}

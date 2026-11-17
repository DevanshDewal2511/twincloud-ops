variable "environment_name" {
  type        = string
  default     = "twincloud-prod"
  description = "Project environment prefix"
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "Primary AWS Region"
}

variable "azure_region" {
  type        = string
  default     = "eastus"
  description = "Secondary Azure Region"
}

variable "domain_name" {
  type        = string
  default     = "twincloudops.internal"
  description = "Disaster Recovery service domain"
}

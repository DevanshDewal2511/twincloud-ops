variable "environment_name" {
  type        = string
  default     = "twincloud-prod"
  description = "Prefix for Azure resources"
}

variable "azure_region" {
  type        = string
  default     = "eastus"
  description = "Secondary Azure region for disaster recovery"
}

variable "vnet_cidr" {
  type        = string
  default     = "10.1.0.0/16"
  description = "Azure VNet address space"
}

variable "subnet_cidr" {
  type        = string
  default     = "10.1.1.0/24"
  description = "Azure Subnet address prefix"
}

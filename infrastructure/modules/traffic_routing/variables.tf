variable "domain_name" {
  type        = string
  default     = "twincloudops.internal"
  description = "Domain name for the multi-cloud service"
}

variable "primary_endpoint" {
  type        = string
  description = "Hostname or IP of Primary AWS ALB"
}

variable "secondary_endpoint" {
  type        = string
  description = "Hostname or IP of Secondary Azure Container/App Service"
}

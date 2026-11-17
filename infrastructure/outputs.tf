output "primary_aws_alb" {
  value       = module.aws_primary.alb_dns_name
  description = "Primary AWS Application Load Balancer DNS"
}

output "secondary_azure_fqdn" {
  value       = module.azure_secondary.fqdn
  description = "Secondary Azure Standby FQDN"
}

output "global_ingress_fqdn" {
  value       = module.traffic_routing.failover_fqdn
  description = "Global Multi-Cloud Disaster Recovery Ingress DNS"
}

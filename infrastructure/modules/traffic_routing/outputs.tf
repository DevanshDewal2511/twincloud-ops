output "failover_fqdn" {
  value       = aws_route53_record.primary.fqdn
  description = "Global failover domain name"
}

output "primary_health_check_id" {
  value       = aws_route53_health_check.primary_health.id
  description = "Health Check ID for the Primary AWS Endpoint"
}

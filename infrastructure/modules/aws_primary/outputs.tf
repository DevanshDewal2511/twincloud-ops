output "vpc_id" {
  value       = aws_vpc.primary.id
  description = "The ID of the Primary AWS VPC"
}

output "alb_dns_name" {
  value       = aws_lb.primary_alb.dns_name
  description = "The Public DNS of the Primary AWS Application Load Balancer"
}

output "alb_zone_id" {
  value       = aws_lb.primary_alb.zone_id
  description = "The Canonical Hosted Zone ID of the Primary AWS ALB"
}

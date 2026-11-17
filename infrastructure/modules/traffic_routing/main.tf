# TwinCloud Ops - Multi-Cloud Disaster Recovery Traffic Routing Module

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# 1. Route 53 Health Check for Primary Cloud (AWS)
resource "aws_route53_health_check" "primary_health" {
  fqdn              = var.primary_endpoint
  port              = 80
  type              = "HTTP"
  resource_path     = "/health.json"
  failure_threshold = 2
  request_interval  = 10

  tags = {
    Name = "AWS-Primary-Health-Check"
  }
}

# 2. DNS Failover Routing
resource "aws_route53_zone" "main" {
  name = var.domain_name
}

# Primary DNS record (AWS)
resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.domain_name}"
  type    = "CNAME"
  ttl     = 30

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier  = "primary-aws"
  records         = [var.primary_endpoint]
  health_check_id = aws_route53_health_check.primary_health.id
}

# Secondary DNS record (Azure - Standby Disaster Recovery target)
resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.domain_name}"
  type    = "CNAME"
  ttl     = 30

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier = "secondary-azure"
  records        = [var.secondary_endpoint]
}

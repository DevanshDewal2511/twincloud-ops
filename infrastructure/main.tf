# TwinCloud Ops - Root Infrastructure Blueprint (Multi-Cloud Disaster Recovery)

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region                      = var.aws_region
  skip_credentials_validation = true
  skip_requesting_account_id  = true
}

provider "azurerm" {
  features {}
  skip_provider_registration = true
}

# 1. Primary Cloud Tier (AWS in us-east-1)
module "aws_primary" {
  source           = "./modules/aws_primary"
  environment_name = var.environment_name
  aws_region       = var.aws_region
}

# 2. Secondary Disaster Recovery Tier (Azure in eastus)
module "azure_secondary" {
  source           = "./modules/azure_secondary"
  environment_name = var.environment_name
  azure_region     = var.azure_region
}

# 3. Global Traffic Ingress & Failover Manager
module "traffic_routing" {
  source             = "./modules/traffic_routing"
  domain_name        = var.domain_name
  primary_endpoint   = module.aws_primary.alb_dns_name
  secondary_endpoint = module.azure_secondary.fqdn
}

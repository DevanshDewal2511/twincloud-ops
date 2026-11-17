# TwinCloud Ops - Azure Secondary Infrastructure Module (Concept / Production Model)

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# 1. Resource Group & Networking
resource "azurerm_resource_group" "secondary" {
  name     = "${var.environment_name}-azure-rg"
  location = var.azure_region

  tags = {
    Role        = "Disaster-Recovery-Secondary"
    ManagedBy   = "TwinCloud-Ops-Terraform"
  }
}

resource "azurerm_virtual_network" "vnet" {
  name                = "${var.environment_name}-vnet"
  address_space       = [var.vnet_cidr]
  location            = azurerm_resource_group.secondary.location
  resource_group_name = azurerm_resource_group.secondary.name
}

resource "azurerm_subnet" "subnet" {
  name                 = "${var.environment_name}-subnet"
  resource_group_name  = azurerm_resource_group.secondary.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [var.subnet_cidr]
}

resource "azurerm_network_security_group" "nsg" {
  name                = "${var.environment_name}-nsg"
  location            = azurerm_resource_group.secondary.location
  resource_group_name = azurerm_resource_group.secondary.name

  security_rule {
    name                       = "AllowHTTP"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# 2. Azure Container Instance (Simulated Standby Node)
resource "azurerm_container_group" "secondary_app" {
  name                = "${var.environment_name}-azure-secondary"
  location            = azurerm_resource_group.secondary.location
  resource_group_name = azurerm_resource_group.secondary.name
  ip_address_type     = "Public"
  dns_name_label      = "${var.environment_name}-dr-azure"
  os_type             = "Linux"

  container {
    name   = "twincloud-azure-secondary"
    image  = "nginx:alpine"
    cpu    = "0.5"
    memory = "1.0"

    ports {
      port     = 80
      protocol = "TCP"
    }

    readiness_probe {
      http_get {
        path = "/health.json"
        port = 80
      }
      period_seconds = 10
    }
  }

  tags = {
    Environment = "Secondary"
    Role        = "Standby-DR"
  }
}

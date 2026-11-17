output "resource_group_name" {
  value       = azurerm_resource_group.secondary.name
  description = "The name of the Azure Resource Group"
}

output "fqdn" {
  value       = azurerm_container_group.secondary_app.fqdn
  description = "Public Fully Qualified Domain Name of the Azure Secondary Node"
}

output "ip_address" {
  value       = azurerm_container_group.secondary_app.ip_address
  description = "Public IP Address of the Azure Secondary Node"
}

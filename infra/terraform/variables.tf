variable "kubeconfig_path" {
  description = "Caminho do kubeconfig usado pelo provider kubernetes"
  type        = string
  default     = "~/.kube/config"
}

variable "namespace" {
  description = "Namespace da plataforma de pedidos"
  type        = string
  default     = "pedidos-veloz"
}

variable "environment" {
  description = "Ambiente alvo"
  type        = string
  default     = "prod"
}

variable "db_user" {
  description = "Usuario do PostgreSQL"
  type        = string
  default     = "orders"
}

variable "db_password" {
  description = "Senha do PostgreSQL"
  type        = string
  sensitive   = true
}

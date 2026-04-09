provider "kubernetes" {
  config_path = var.kubeconfig_path
}

resource "kubernetes_namespace" "pedidos" {
  metadata {
    name = var.namespace
    labels = {
      app         = "pedidos-veloz"
      environment = var.environment
    }
  }
}

resource "kubernetes_config_map_v1" "app_config" {
  metadata {
    name      = "app-config"
    namespace = kubernetes_namespace.pedidos.metadata[0].name
  }

  data = {
    ORDERS_URL                          = "http://orders:8081"
    STOCK_URL                           = "http://stock:8083"
    PAYMENTS_URL                        = "http://payments:8082"
    DB_HOST                             = "postgres"
    DB_PORT                             = "5432"
    DB_NAME                             = "ordersdb"
    ORDER_EVENTS_QUEUE                  = "pedido.criado"
    OTEL_EXPORTER_OTLP_TRACES_ENDPOINT  = "http://otel-collector:4318/v1/traces"
  }
}

resource "kubernetes_secret_v1" "app_secrets" {
  metadata {
    name      = "app-secrets"
    namespace = kubernetes_namespace.pedidos.metadata[0].name
  }

  type = "Opaque"

  data = {
    DB_USER           = var.db_user
    DB_PASSWORD       = var.db_password
    POSTGRES_PASSWORD = var.db_password
    RABBITMQ_URL      = "amqp://rabbitmq:5672"
  }
}

# Esqueleto para evolucao: conectar modulo de cluster gerenciado (AKS/EKS/GKE)
# e aplicar manifests da aplicacao via Helm/Kustomize provider no mesmo fluxo.

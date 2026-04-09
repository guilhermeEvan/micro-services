# Pedidos Veloz - Entrega continua em microsservicos

MVP de referencia para a Loja Veloz cobrindo o ciclo completo de Dev -> Build -> Deploy -> Operacao em ambiente cloud-native.

## 1. Objetivo do desafio

Esta entrega resolve o problema central de:
- reduzir risco de deploy;
- melhorar lead time de entrega;
- escalar sob demanda em picos;
- elevar confiabilidade com automacao, governanca e telemetria.

## 2. Arquitetura proposta

Servicos:
1. API Gateway (porta 8080)
2. Orders (porta 8081)
3. Payments (porta 8082)
4. Stock (porta 8083)
5. PostgreSQL
6. RabbitMQ (opcional e justificado para evento `PedidoCriado`)

Observabilidade:
- OpenTelemetry Collector
- Jaeger (tracing distribuido)
- Prometheus (metricas)
- Grafana (dashboards)

## 3. Decisoes de engenharia (justificativa)

- Mensageria opcional com RabbitMQ: desacopla fluxo sincrono de eventos de dominio e prepara a plataforma para futuras assinaturas (faturamento, notificacao, analytics).
- Deploy strategy: RollingUpdate em Kubernetes por ser nativo, simples de operar e com rollback imediato.
- Escalabilidade: HPA para `api-gateway` e `orders`, que sao os maiores candidatos a pico de carga.
- Seguranca basica de runtime: `runAsNonRoot`, `readOnlyRootFilesystem`, `allowPrivilegeEscalation: false`, Secrets para credenciais.

## 4. Estrutura do repositorio

- `services/`: microsservicos Node.js
- `database/init/`: script de bootstrap do PostgreSQL
- `compose.yaml`: ambiente local padronizado
- `k8s/base/`: manifests de producao com Kustomize
- `observability/`: configs do OpenTelemetry, Prometheus e Grafana
- `.github/workflows/ci-cd.yml`: pipeline de CI/CD
- `infra/terraform/`: esqueleto IaC
- `docs/research.md`: pesquisa primaria + benchmark publico

## 5. Executando localmente (Docker Compose)

Pre-requisitos:
- Docker + Docker Compose

Passos:
1. Criar arquivo de ambiente:
   - `cp .env.example .env`
2. Subir stack completo:
   - `docker compose up --build -d`
3. Testar health:
   - `curl http://localhost:8080/health`
4. Criar pedido:
   - `curl -X POST http://localhost:8080/orders -H "Content-Type: application/json" -d '{"customer":"ana","item_id":"sku-1","quantity":1}'`
5. Consultar observabilidade:
   - Grafana: http://localhost:3000
   - Prometheus: http://localhost:9090
   - Jaeger: http://localhost:16686
   - RabbitMQ: http://localhost:15672

## 6. Deploy em Kubernetes

Pre-requisitos:
- Cluster Kubernetes (gerenciado ou proprio)
- `kubectl` + `kustomize`

Passos:
1. Ajustar imagens em `k8s/base/platform.yaml` para seu registry.
2. Aplicar manifests:
   - `kubectl apply -k k8s/base`
3. Verificar status:
   - `kubectl get pods -n pedidos-veloz`
   - `kubectl get hpa -n pedidos-veloz`

## 7. CI/CD (GitHub Actions)

Pipeline implementado em `.github/workflows/ci-cd.yml`:
1. PR e Push:
   - `npm ci` por servico
   - smoke test
   - build de imagem por servico
2. Push em `main`:
   - push para GHCR
   - deploy com `kubectl apply -k`
   - validacao de rollout

Segredos esperados:
- `KUBE_CONFIG` (base64 do kubeconfig)

## 8. IaC (Terraform - esqueleto)

Local: `infra/terraform/`

Entregue:
- Provider Kubernetes
- Namespace
- ConfigMap
- Secret

Evolucao recomendada:
1. Modulo para cluster gerenciado (AKS/EKS/GKE)
2. Modulo de observabilidade (Prometheus Stack/OTel Collector)
3. Modulo de aplicacao (Helm/Kustomize com versionamento)

## 9. Roadmap de 4 semanas

Semana 1:
- padronizar desenvolvimento local com Compose
- containerizar servicos e definir estrategia de versionamento

Semana 2:
- publicar imagens em registry
- subir em K8s com probes, config/secret e politica de seguranca minima

Semana 3:
- implantar CI/CD com gates de validacao
- configurar HPA e testes de carga basicos

Semana 4:
- reforcar observabilidade (SLIs/SLOs, dashboards, alertas)
- hardening de seguranca e ensaio de rollback

## 10. Fontes de pesquisa

- Kubernetes Deployments: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
- Docker Compose docs: https://docs.docker.com/compose/
- Case publico: https://github.com/GoogleCloudPlatform/microservices-demo

## 11. Limites do MVP

- Banco e RabbitMQ com persistencia simplificada em K8s (para foco didatico do desafio).
- Deploy strategy implementada: RollingUpdate. Blue/Green e Canary ficam como evolucao (ex.: Argo Rollouts).
- Logs foram mantidos em stdout para coleta centralizada no runtime (Loki/ELK podem ser adicionados no proximo ciclo).

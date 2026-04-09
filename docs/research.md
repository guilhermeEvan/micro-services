# Pesquisa primaria e benchmark de mercado

## Fontes primarias obrigatorias

1. Kubernetes official docs - Deployments
- Link: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
- Evidencia usada no projeto: estrategia RollingUpdate com substituicao controlada de Pods, suporte a rollback e integracao com HPA.

2. Docker official docs - Docker Compose
- Link: https://docs.docker.com/compose/
- Evidencia usada no projeto: Compose como definicao unica do stack multi-servico para desenvolvimento local, testes e CI.

## Exemplo concreto (case publico)

3. GoogleCloudPlatform/microservices-demo (Online Boutique)
- Link: https://github.com/GoogleCloudPlatform/microservices-demo
- Motivo da escolha: caso real e amplamente adotado de e-commerce em microsservicos, com manifests Kubernetes, opcao de Terraform e componentes de observabilidade.
- O que foi reaproveitado como referencia de arquitetura:
  - Separacao por servicos com contratos claros.
  - Deploy declarativo em Kubernetes.
  - Estrategias de extensao para service mesh e tracing.
  - Reprodutibilidade local + cloud.

## Sintese de aprendizado aplicado na Loja Veloz

- Desenvolvimento local precisa ser padronizado por um unico compose file.
- Produzibilidade em K8s depende de readiness/liveness probes, requests/limits e rollout controlado.
- Escala elastica depende de HPA orientado por CPU inicialmente (e evolucao posterior por metricas de negocio).
- Observabilidade efetiva exige metrico + logs + tracing distribuido, nao apenas dashboards de CPU/memoria.

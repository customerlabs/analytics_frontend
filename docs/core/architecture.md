# Architecture

## Overview

This setup runs **Next.js**, **Keycloak**, and **FastAPI** inside **GKE**.
**FastAPI** is externally reachable for integrations (webhooks, data retrieval).
**Cloud SQL Postgres** uses private IP inside the VPC.

## High-Level Architecture

```mermaid
flowchart LR
    User((Browser)) -->|"app.domain.com"| NextJS
    ExtSvc((External Services)) -->|"api.domain.com"| FastAPI

    NextJS -->|OIDC| Keycloak
    NextJS -->|API Calls| FastAPI
    FastAPI --> Postgres[(Cloud SQL Postgres)]
    Keycloak --> Postgres
```

## Infrastructure Architecture (GCP View)

```mermaid
graph TB
    subgraph GCP["GCP Project"]
        subgraph PublicZone["Public Zone"]
            LB[External HTTPS Load Balancer]
        end

        subgraph VPC["VPC Network"]
            subgraph GKE["GKE Cluster"]
                Ingress[Ingress Controller]
                NextJS[Next.js - Frontend UI]
                Keycloak[Keycloak - Auth Server]
                FastAPI[FastAPI - Backend API]
            end
            Postgres[(Cloud SQL Postgres)]
        end
    end

    User((Browser)) --> LB
    ExtSvc((External Services)) --> LB
    LB --> Ingress
    Ingress -->|"app.domain.com"| NextJS
    Ingress -->|"api.domain.com"| FastAPI
    NextJS -->|Internal| FastAPI
    NextJS -->|OIDC| Keycloak
    FastAPI --> Postgres
    Keycloak --> Postgres
```

## Ingress Routing

| Host | Target Service | Purpose |
|------|----------------|---------|
| `app.domain.com` | Next.js | Frontend UI |
| `api.domain.com` | FastAPI | External API |

## Networking Notes

- Next.js, Keycloak, FastAPI run as pods in GKE.
- Pod-to-pod traffic is internal (ClusterIP services).
- FastAPI supports both internal calls (from Next.js) and external calls (from integrations).
- Cloud SQL uses private IP (Private Service Connect).

## Recommendation

- **Browser → API:** Use **BFF** if security is highest priority (browser never sees JWT).
- **Browser → API (direct):** Use **httpOnly cookie** for good security + low latency.
- **External integrations:** Keep `api.domain.com` and use **API keys or service JWTs**.

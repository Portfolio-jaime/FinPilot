# FinPilot — Design Spec
**Date:** 2026-04-05
**Status:** Approved (v2 — post spec review)
**Author:** Jaime Henao

---

## 1. Problem Statement

Managing a personal investment pipeline in Colombia requires multiple manual steps each month: move COP to DólarApp/Littio, convert to USD, decide when balance is large enough to invest, execute purchase on Interactive Brokers. This is error-prone and requires discipline. FinPilot automates the decision layer and tracks the full pipeline, initially for a single user and then for multiple users in Colombia.

---

## 2. Product Overview

**FinPilot** is a multi-user investment copilot for Colombia. It helps users manage:

- COP savings (NU-style tracking)
- COP → USD conversion timing
- USD accumulation until investment threshold is reached
- ETF purchase recommendations (VOO/QQQ via Interactive Brokers)

Phase 1 (MVP): Manual balance input + decision engine + simulator
Phase 2: Portfolio tracking, alerts, dashboard
Phase 3: Real API integrations (IBKR, Littio, DólarApp FX rates)

**Target users:** Colombians investing in global ETFs via Interactive Brokers
**Geography:** Colombia only (MVP)
**Languages:** Spanish UI

---

## 3. Architecture

### 3.1 Monorepo Structure

```
finpilot/                          ← Turborepo root (pnpm workspaces)
  apps/
    api/                           ← NestJS REST API (port 3001)
    web/                           ← Next.js 14 App Router (port 3000)
  packages/
    types/                         ← Shared DTOs and interfaces
    simulator/                     ← Pure financial logic (no HTTP)
    eslint-config/
    tsconfig/
  k8s/
    base/                          ← Kustomize base manifests
      api/
      web/
      db/                          ← PostgreSQL (dev/kind only)
      namespace.yaml
    overlays/
      dev/                         ← Kind cluster (local)
      staging/
      production/                  ← EKS
  argocd/
    apps/
      finpilot-dev.yaml
      finpilot-production.yaml
    install/
  infra/
    terraform/
      eks/
      rds/
      ecr/
      vpc/
  .github/
    workflows/
      ci.yml
      build-push.yml
  docker-compose.yml               ← Local dev (DB + tools, no Kind needed)
  turbo.json
  pnpm-workspace.yaml
```

### 3.2 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10 + TypeScript |
| ORM | Prisma (PostgreSQL) |
| Frontend | Next.js 14 (App Router) + Tailwind + React Query |
| Package manager | pnpm |
| Monorepo | Turborepo |
| Containers | Docker (everything runs containerized) |
| Local Kubernetes | Kind |
| Production Kubernetes | AWS EKS |
| Database (prod) | AWS RDS PostgreSQL 15 |
| Database (dev) | PostgreSQL in Kind (StatefulSet) |
| Container registry | AWS ECR |
| GitOps | ArgoCD |
| CI | GitHub Actions |
| IaC | Terraform |
| Secrets (prod) | AWS Secrets Manager + Kubernetes Secrets |
| Secrets (dev) | Kubernetes Secrets from .env via kustomize |

### 3.3 GitOps Flow

```
Developer pushes to main
        ↓
GitHub Actions: lint → test → docker build
        ↓
Push image to ECR (tag = git SHA)
        ↓
GHA: update newTag in k8s/overlays/production/kustomization.yaml
        ↓
ArgoCD polls GitHub every 3min (or webhook)
        ↓
ArgoCD detects manifest change → sync to EKS
        ↓
EKS: rolling update (zero downtime)
```

### 3.4 Local Dev Flow (Kind)

```bash
# One-time setup
kind create cluster --config k8s/kind-config.yaml
kubectl apply -k argocd/install/
kubectl apply -f argocd/apps/finpilot-dev.yaml
# ArgoCD syncs k8s/overlays/dev/ automatically

# Or simpler: docker-compose for just DB + API dev
docker-compose up -d
```

---

## 4. Data Model

### Prisma Schema

```prisma
model User {
  id            String          @id @default(cuid())
  email         String          @unique
  passwordHash  String
  name          String
  country       String          @default("CO")
  createdAt     DateTime        @default(now())
  wallets       Wallet[]
  plan          InvestmentPlan?
  refreshTokens RefreshToken[]
}

model Wallet {
  id           String        @id @default(cuid())
  currency     String        // "COP" | "USD"
  balance      Decimal       @db.Decimal(18, 2)
  userId       String
  user         User          @relation(fields: [userId], references: [id])
  transactions Transaction[]

  @@unique([userId, currency])
}

model Transaction {
  id           String      @id @default(cuid())
  type         TxType
  amount       Decimal     @db.Decimal(18, 2)
  currency     String
  note         String?
  exchangeRate Decimal?    @db.Decimal(10, 4) // COP/USD rate used for CONVERT transactions
  walletId     String
  wallet       Wallet      @relation(fields: [walletId], references: [id])
  createdAt    DateTime    @default(now())
}

enum TxType {
  DEPOSIT
  WITHDRAWAL
  CONVERT
  INVEST
}

model InvestmentPlan {
  id                  String              @id @default(cuid())
  monthlyContribution Decimal             @db.Decimal(18, 2)
  investThresholdUsd  Decimal             @db.Decimal(18, 2) @default(400)
  convertThresholdCop Decimal             @db.Decimal(18, 2) @default(150000)
  etfAllocation       Json                // validated: { "VOO": 70, "QQQ": 30 } must sum to 100
  userId              String              @unique
  user                User                @relation(fields: [userId], references: [id])
  snapshots           PortfolioSnapshot[] // schema created in Phase 1, endpoint enabled in Phase 2
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
}

// Schema in Phase 1 (migration runs), endpoint GET /snapshots enabled in Phase 2
model PortfolioSnapshot {
  id            String         @id @default(cuid())
  copBalance    Decimal        @db.Decimal(18, 2)
  usdBalance    Decimal        @db.Decimal(18, 2)
  totalValueUsd Decimal        @db.Decimal(18, 2)
  planId        String
  plan          InvestmentPlan @relation(fields: [planId], references: [id])
  takenAt       DateTime       @default(now())
}

// Refresh tokens stored as SHA-256 hash — lookup via hashed value, not plaintext
model RefreshToken {
  id           String   @id @default(cuid())
  tokenHash    String   @unique // SHA-256(rawToken), never stored raw
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  expiresAt    DateTime
  createdAt    DateTime @default(now())
}
```

### Refresh Token Strategy (C3 fix)

Raw token is generated as `crypto.randomBytes(64).toString('hex')` and returned to client.
Stored in DB as `SHA-256(rawToken)` under `tokenHash`. On refresh:

```
incoming rawToken → SHA-256 → lookup by tokenHash → validate expiry → issue new accessToken
```

This allows `@unique` index on the hash while never storing the plaintext token.

### ETF Allocation Validation

`etfAllocation` validated via Zod schema in `packages/types`:

```typescript
// packages/types/src/investment.schema.ts
export const EtfAllocationSchema = z.record(z.string().min(1), z.number().min(1).max(100))
  .refine(obj => Object.values(obj).reduce((a, b) => a + b, 0) === 100, {
    message: 'ETF allocations must sum to 100',
  });
```

---

## 5. API Design

> **Global prefix:** NestJS sets `app.setGlobalPrefix('api')` in `main.ts`.
> All API routes below are therefore mounted at `/api/...` (e.g. `POST /api/auth/login`).
> The Ingress routes `/api/*` → `api:3001` without any prefix stripping — NestJS handles the full path.

### Auth
```
POST /api/auth/register    ← { email, password, name }
POST /api/auth/login       ← { email, password } → { accessToken, refreshToken }
POST /api/auth/refresh     ← { refreshToken } → { accessToken }
POST /api/auth/logout
GET  /health               ← (no prefix, excluded from global prefix)
```

### Wallets
```
GET  /wallets                  ← list user wallets (COP, USD)
POST /wallets/deposit          ← { currency, amount }
POST /wallets/convert          ← { amountCop, exchangeRate }
```

### Investment Plan (1:1 with user)
```
GET  /plan                     ← get user's plan (singular)
POST /plan                     ← create plan
PUT  /plan                     ← update plan
```

### Investment Engine
```
GET  /investments/recommendation   ← INVEST | ACCUMULATE | CONVERT + message
GET  /investments/simulate         ← ?months=36 → projection breakdown
GET  /investments/scenarios        ← compare conservative/base/aggressive
```

### Transactions
```
GET  /transactions             ← paginated history
                                  Query params: ?page=1&limit=20 (default limit: 20, max: 100)
                                  Response: { data: Transaction[], total: number, page: number, limit: number }
POST /transactions             ← manual entry
```

### Portfolio Snapshots (Phase 2 — endpoint returns 404 in Phase 1)
```
GET  /snapshots                ← history of daily snapshots (enabled Phase 2)
```

---

## 6. Financial Logic (packages/simulator)

### Decision Engine

```
Inputs: usdBalance, copBalance, monthlyContribution, investThresholdUsd, convertThresholdCop

Priority 1: usdBalance >= investThresholdUsd  → action: INVEST
Priority 2: copBalance >= convertThresholdCop → action: CONVERT
Default:                                       → action: ACCUMULATE
```

### Investment Simulator

Inputs: initialBalance (USD), monthlyContribution (USD), annualReturn, months
Output: totalInvested, totalValue, profit, profitPercent, monthlyBreakdown[]

Money handled as `Decimal` in DB, converted to `number` only at simulator boundary. All outputs rounded to 2 decimal places.

---

## 7. Kubernetes Architecture

### Health Checks (C2 fix)

All services expose health endpoints used by Kubernetes liveness/readiness probes:

**API (`apps/api`):**
```
GET /health         → { status: "ok", timestamp: "...", db: "ok" }
HTTP 200 if healthy, 503 if DB unreachable
```

Kubernetes probe config (in `k8s/base/api/deployment.yaml`):
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 15
  periodSeconds: 20
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
```

**Web (`apps/web`):**
```
GET /api/health     → { status: "ok" }
```

Kubernetes probe config:
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 20
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
```

### Ingress (C4 fix)

**Controller:** AWS Load Balancer Controller (EKS) / NodePort for Kind

**Routing (production):**
```
finpilot.app  /api/*  → api:3001   (no prefix strip — NestJS owns the full /api path)
finpilot.app  /*      → web:3000
```

**TLS:** ACM certificate via `alb.ingress.kubernetes.io/certificate-arn` annotation

**`k8s/base/ingress.yaml` structure:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: finpilot-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
    - host: finpilot.app
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service: { name: api, port: { number: 3001 } }
          - path: /
            pathType: Prefix
            backend:
              service: { name: web, port: { number: 3000 } }
```

**Dev (Kind):** NodePort services, accessed via `localhost:30001` (api) and `localhost:30000` (web). Defined in `k8s/overlays/dev/`.

### Namespaces
- `finpilot-dev` (Kind)
- `finpilot-staging` (EKS)
- `finpilot-production` (EKS)

### Workloads per environment

| Resource | Dev (Kind) | Production (EKS) |
|----------|-----------|-----------------|
| api | Deployment, 1 replica | Deployment, 2+ replicas |
| web | Deployment, 1 replica | Deployment, 2+ replicas |
| db | StatefulSet (postgres:15) | AWS RDS (external) |
| ArgoCD | Installed in cluster | Installed in cluster |

### Kustomize strategy
- `k8s/base/` — common manifests (Deployment, Service, ConfigMap shape)
- `k8s/overlays/dev/` — dev image tags, resource limits (small), NodePort services
- `k8s/overlays/production/` — prod image tags (updated by CI), HPA, ClusterIP + Ingress

---

## 8. CI/CD Pipeline

### ci.yml (PRs)
1. Checkout
2. pnpm install
3. Lint (all packages)
4. Type check
5. Unit tests (packages/simulator)
6. Docker build smoke test (api + web)

### build-push.yml (merge to main)
1. Checkout
2. Configure AWS credentials (OIDC role — no long-lived access keys)
3. Login to ECR via `aws-actions/amazon-ecr-login@v2`
4. pnpm install + build (turbo run build)
5. Docker build api → push ECR `$ECR_REGISTRY/finpilot-api:$SHA`
6. Docker build web → push ECR `$ECR_REGISTRY/finpilot-web:$SHA`
7. Update `newTag: $SHA` in `k8s/overlays/production/kustomization.yaml`
8. Commit + push to main (triggers ArgoCD sync)

**ECR auth note:** Uses GitHub OIDC + AWS IAM role (no static access keys stored in GitHub secrets).
Required IAM permissions: `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`.

---

## 9. Terraform Modules

```
infra/terraform/
  vpc/      ← VPC, subnets (public + private), NAT gateway
  ecr/      ← ECR repositories (finpilot-api, finpilot-web)
  eks/      ← EKS cluster, managed node groups, OIDC provider, IAM roles
  rds/      ← RDS PostgreSQL 15, subnet group, parameter group
  iam/      ← GitHub Actions OIDC role, EKS → RDS access policy
```

State stored in S3 + DynamoDB lock.

### RDS Connectivity (I7 fix)

Security group rules:
- EKS worker nodes SG → RDS SG: allow TCP 5432
- RDS SG: no public access (`publicly_accessible = false`)
- `DATABASE_URL` injected into API pods via Kubernetes Secret (created from AWS Secrets Manager in prod, from `.env` in dev)

---

## 10. MVP Feature Scope

### Phase 1 (Build now)
- [x] Auth (register, login, JWT refresh)
- [x] Wallet management (COP + USD balances, manual input)
- [x] Investment plan configuration
- [x] Decision engine (INVEST / CONVERT / ACCUMULATE)
- [x] Investment simulator (1yr, 3yr, 5yr projections)
- [x] Dashboard (balances, recommendation, chart)
- [x] Transaction history

### Phase 2 (Post-MVP)
- [ ] Daily portfolio snapshots (EventBridge cron)
- [ ] Email/push alerts ("you can invest now")
- [ ] Multi-scenario simulator comparison

### Phase 3 (Future)
- [ ] FX rates API (live COP/USD rate)
- [ ] IBKR API integration (real portfolio data)
- [ ] DólarApp / Littio connection

---

## 11. Security

- Passwords: bcrypt, 12 rounds
- JWT access token: 15min expiry, signed with `JWT_SECRET`
- Refresh token: 30 days, `SHA-256` hash stored in DB (never plaintext)
- All endpoints protected with `JwtAuthGuard` except `/auth/*` and `/health`
- Rate limiting: `@nestjs/throttler` on auth endpoints (10 req/min per IP)
- Secrets in prod: AWS Secrets Manager → Kubernetes Secrets (manual sync for MVP, External Secrets Operator post-MVP)
- HTTPS: ALB + ACM certificate (EKS prod only)
- No secrets in git — `.env` in `.gitignore`, secrets passed via K8s Secrets

## 11b. Environment Variables (C1 fix)

### apps/api

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Access token signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing secret (min 32 chars) |
| `JWT_ACCESS_EXPIRY` | No | Default: `15m` |
| `JWT_REFRESH_EXPIRY` | No | Default: `30d` |
| `PORT` | No | Default: `3001` |
| `NODE_ENV` | No | `development` \| `production` |

### apps/web

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL (e.g. `http://localhost:3001`) |

> next-auth is NOT in scope for Phase 1. Auth is handled by the NestJS API with JWT cookies. `NEXTAUTH_SECRET` is not needed.

### Kubernetes ConfigMap (non-secret) / Secret (secret)

| Resource type | Variables |
|---------------|-----------|
| ConfigMap | `PORT`, `NODE_ENV`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` |
| Secret | `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` |

---

## 12. Development Setup

### Prerequisites
- Docker Desktop
- Kind
- kubectl + kustomize
- pnpm
- Node 20

### apps/api/.env.example

```env
DATABASE_URL=postgresql://finpilot:finpilot_dev@localhost:5432/finpilot
JWT_SECRET=change_me_min_32_chars_long_secret
JWT_REFRESH_SECRET=change_me_another_min_32_chars_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
PORT=3001
NODE_ENV=development
```

### Quick start (docker-compose, no Kind needed)
```bash
git clone <repo>
cp apps/api/.env.example apps/api/.env    # fill in secrets
pnpm install
docker-compose up -d   # starts: postgres:15 (5432), pgadmin (8080)
pnpm dev               # turbo run dev → api:3001 + web:3000
```

### docker-compose.yml services

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: finpilot
      POSTGRES_USER: finpilot
      POSTGRES_PASSWORD: finpilot_dev
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  pgadmin:
    image: dpage/pgadmin4
    ports: ["8080:80"]
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@finpilot.local
      PGADMIN_DEFAULT_PASSWORD: admin

volumes:
  pgdata:
```

### Full Kind setup
```bash
kind create cluster --config k8s/kind-config.yaml
# kind-config.yaml maps hostPort 30000→NodePort 30000 (web) and 30001→30001 (api)
kubectl apply -k argocd/install/
kubectl apply -f argocd/apps/finpilot-dev.yaml
# Done — ArgoCD syncs k8s/overlays/dev/ automatically
# Access: http://localhost:30000 (web), http://localhost:30001 (api)
```

### Turborepo pipeline (turbo.json)

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

### ArgoCD Applications Pattern

Both `finpilot-dev.yaml` and `finpilot-production.yaml` use a flat Application manifest (not app-of-apps) pointing to the respective Kustomize overlay. Sync policy: automated with self-heal enabled for dev, manual for production (requires ArgoCD UI approval).

```yaml
# argocd/apps/finpilot-dev.yaml
spec:
  source:
    repoURL: https://github.com/<org>/finpilot
    targetRevision: main
    path: k8s/overlays/dev
  syncPolicy:
    automated:
      selfHeal: true
      prune: true
```

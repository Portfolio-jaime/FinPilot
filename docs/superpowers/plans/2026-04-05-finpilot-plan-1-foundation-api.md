# FinPilot — Plan 1: Foundation & API

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Turborepo monorepo, build shared packages (types + simulator), and implement the full NestJS REST API with auth, wallets, investment plan, decision engine, simulator, and transactions — all running via Docker Compose locally.

**Architecture:** Turborepo monorepo with pnpm workspaces. `packages/simulator` holds pure financial logic tested independently. `apps/api` is a NestJS app consuming the simulator package. All local dev runs via `docker-compose up` (PostgreSQL) + `pnpm dev`.

**Tech Stack:** Node 20, pnpm, Turborepo, NestJS 10, Prisma, PostgreSQL 15, Jest, Docker Compose, TypeScript 5.

**Spec:** `docs/superpowers/specs/2026-04-05-finpilot-design.md`
**Skills:** `fintech-nestjs-api`, `fintech-decision-engine`, `fintech-investment-simulator`

---

## File Map

```
finpilot/
  package.json                          ← root workspace config
  pnpm-workspace.yaml
  turbo.json
  .gitignore
  docker-compose.yml

  packages/
    tsconfig/
      package.json
      base.json
      nestjs.json
      nextjs.json
    types/
      package.json
      tsconfig.json
      src/
        index.ts
        auth.types.ts
        wallet.types.ts
        investment.types.ts
        transaction.types.ts
    simulator/
      package.json
      tsconfig.json
      src/
        index.ts
        decision.engine.ts
        investment.simulator.ts
      tests/
        decision.engine.test.ts
        investment.simulator.test.ts

  apps/
    api/
      package.json
      tsconfig.json
      nest-cli.json
      Dockerfile
      .env.example
      prisma/
        schema.prisma
      src/
        main.ts
        app.module.ts
        prisma/
          prisma.module.ts
          prisma.service.ts
        common/
          filters/http-exception.filter.ts
          interceptors/transform.interceptor.ts
          decorators/current-user.decorator.ts
        modules/
          health/
            health.controller.ts
            health.module.ts
          auth/
            auth.module.ts
            auth.controller.ts
            auth.service.ts
            strategies/jwt.strategy.ts
            strategies/jwt-refresh.strategy.ts
            guards/jwt-auth.guard.ts
            dto/register.dto.ts
            dto/login.dto.ts
            dto/refresh.dto.ts
          users/
            users.module.ts
            users.service.ts
          wallets/
            wallets.module.ts
            wallets.controller.ts
            wallets.service.ts
            dto/deposit.dto.ts
            dto/convert.dto.ts
          plan/
            plan.module.ts
            plan.controller.ts
            plan.service.ts
            dto/create-plan.dto.ts
            dto/update-plan.dto.ts
          investments/
            investments.module.ts
            investments.controller.ts
            investments.service.ts
          transactions/
            transactions.module.ts
            transactions.controller.ts
            transactions.service.ts
            dto/create-transaction.dto.ts
      test/
        app.e2e-spec.ts
```

---

## Chunk 1: Monorepo Scaffold

### Task 1: Init git + root workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`

- [ ] **Step 1: Init git repo**
```bash
cd /Users/jaime.henao/arheanja/FinPilot
git init
```

- [ ] **Step 2: Create root package.json**
```json
{
  "name": "finpilot",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "type-check": "turbo run type-check"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  },
  "packageManager": "pnpm@9.0.0"
}
```

- [ ] **Step 3: Create pnpm-workspace.yaml**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create turbo.json**
```json
{
  "$schema": "https://turbo.build/schema.json",
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

- [ ] **Step 5: Create .gitignore**
```gitignore
node_modules/
dist/
.next/
.env
.env.local
*.log
.turbo/
coverage/
.DS_Store
```

- [ ] **Step 6: Create directory structure**
```bash
mkdir -p apps/api apps/web packages/types packages/simulator packages/tsconfig
mkdir -p packages/eslint-config
# Create eslint-config stub (required for pnpm workspace member)
cat > packages/eslint-config/package.json << 'EOF'
{
  "name": "@finpilot/eslint-config",
  "version": "0.0.1",
  "private": true,
  "main": "index.js"
}
EOF
echo "module.exports = { extends: ['eslint:recommended'] };" > packages/eslint-config/index.js
```

- [ ] **Step 7: Install turbo globally and pnpm**
```bash
npm install -g pnpm@9
pnpm install
```

- [ ] **Step 8: Commit**
```bash
git add .
git commit -m "chore: init turborepo monorepo with pnpm workspaces"
```

---

### Task 2: packages/tsconfig

**Files:**
- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/nestjs.json`
- Create: `packages/tsconfig/nextjs.json`

- [ ] **Step 1: Create package.json**
```json
{
  "name": "@finpilot/tsconfig",
  "version": "0.0.1",
  "private": true,
  "files": ["base.json", "nestjs.json", "nextjs.json"]
}
```

- [ ] **Step 2: Create base.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: Create nestjs.json**
```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "outDir": "./dist"
  },
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

- [ ] **Step 4: Create nextjs.json**
```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "allowJs": true,
    "noEmit": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Commit**
```bash
git add packages/tsconfig/
git commit -m "chore: add shared tsconfig package"
```

---

### Task 3: packages/types

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/auth.types.ts`
- Create: `packages/types/src/wallet.types.ts`
- Create: `packages/types/src/investment.types.ts`
- Create: `packages/types/src/transaction.types.ts`

- [ ] **Step 1: Create package.json**
```json
{
  "name": "@finpilot/types",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@finpilot/tsconfig": "workspace:*",
    "typescript": "^5.4.0"
  },
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**
```json
{
  "extends": "@finpilot/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/auth.types.ts**
```typescript
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
}
```

- [ ] **Step 4: Create src/wallet.types.ts**
```typescript
export type Currency = 'COP' | 'USD';

export interface WalletDto {
  id: string;
  currency: Currency;
  balance: number;
  userId: string;
}

export interface DepositDto {
  currency: Currency;
  amount: number;
}

export interface ConvertDto {
  amountCop: number;
  exchangeRate: number; // COP per 1 USD, e.g. 4200
}
```

- [ ] **Step 5: Create src/investment.types.ts**
```typescript
import { z } from 'zod';

export const EtfAllocationSchema = z
  .record(z.string().min(1), z.number().min(1).max(100))
  .refine(
    (obj) => Object.values(obj).reduce((a, b) => a + b, 0) === 100,
    { message: 'ETF allocations must sum to 100' },
  );

export type EtfAllocation = z.infer<typeof EtfAllocationSchema>;

export type Action = 'INVEST' | 'ACCUMULATE' | 'CONVERT';

export interface DecisionInput {
  usdBalance: number;
  copBalance: number;
  monthlyContribution: number;
  investThresholdUsd?: number;
  convertThresholdCop?: number;
}

export interface DecisionOutput {
  action: Action;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  details: {
    usdNeeded?: number;
    monthsToThreshold?: number;
  };
}

export interface SimulationInput {
  initialBalance: number;
  monthlyContribution: number;
  annualReturn: number;
  months: number;
}

export interface MonthlySnapshot {
  month: number;
  contributed: number;
  totalInvested: number;
  totalValue: number;
  profit: number;
}

export interface SimulationResult {
  totalInvested: number;
  totalValue: number;
  profit: number;
  profitPercent: number;
  monthlyBreakdown: MonthlySnapshot[];
}

export interface PlanDto {
  id: string;
  monthlyContribution: number;
  investThresholdUsd: number;
  convertThresholdCop: number;
  etfAllocation: EtfAllocation;
}

export interface CreatePlanDto {
  monthlyContribution: number;
  investThresholdUsd?: number;
  convertThresholdCop?: number;
  etfAllocation: EtfAllocation;
}
```

- [ ] **Step 6: Create src/transaction.types.ts**
```typescript
export type TxType = 'DEPOSIT' | 'WITHDRAWAL' | 'CONVERT' | 'INVEST';

export interface TransactionDto {
  id: string;
  type: TxType;
  amount: number;
  currency: string;
  note?: string;
  exchangeRate?: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

- [ ] **Step 7: Create src/index.ts**
```typescript
export * from './auth.types';
export * from './wallet.types';
export * from './investment.types';
export * from './transaction.types';
```

- [ ] **Step 8: Install and build**
```bash
pnpm install
pnpm --filter @finpilot/types build
```
Expected: `dist/` created with compiled JS and `.d.ts` files.

- [ ] **Step 9: Commit**
```bash
git add packages/types/
git commit -m "feat(types): add shared DTO and interface package"
```

---

## Chunk 2: packages/simulator (TDD)

### Task 4: Decision Engine

**Files:**
- Create: `packages/simulator/package.json`
- Create: `packages/simulator/tsconfig.json`
- Create: `packages/simulator/src/decision.engine.ts`
- Create: `packages/simulator/tests/decision.engine.test.ts`

- [ ] **Step 1: Create package.json**
```json
{
  "name": "@finpilot/simulator",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@finpilot/types": "workspace:*"
  },
  "devDependencies": {
    "@finpilot/tsconfig": "workspace:*",
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.4.0"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.ts"]
  }
}
```

- [ ] **Step 2: Create tsconfig.json**
```json
{
  "extends": "@finpilot/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write failing tests for decision engine**

Create `packages/simulator/tests/decision.engine.test.ts`:
```typescript
import { evaluateInvestment } from '../src/decision.engine';

describe('evaluateInvestment', () => {
  const base = {
    monthlyContribution: 100,
    investThresholdUsd: 400,
    convertThresholdCop: 150_000,
  };

  it('returns INVEST when USD balance meets threshold', () => {
    const result = evaluateInvestment({ ...base, usdBalance: 400, copBalance: 0 });
    expect(result.action).toBe('INVEST');
    expect(result.urgency).toBe('high');
  });

  it('returns INVEST when USD balance exceeds threshold', () => {
    const result = evaluateInvestment({ ...base, usdBalance: 500, copBalance: 0 });
    expect(result.action).toBe('INVEST');
  });

  it('returns CONVERT when COP meets threshold but USD does not', () => {
    const result = evaluateInvestment({ ...base, usdBalance: 200, copBalance: 150_000 });
    expect(result.action).toBe('CONVERT');
    expect(result.urgency).toBe('medium');
    expect(result.details.usdNeeded).toBe(200);
  });

  it('CONVERT includes monthsToThreshold estimate', () => {
    // usdNeeded: 400-200=200, monthlyContribution: 420_000 COP / 4200 rate = 100 USD/month → ~2 months
    const result = evaluateInvestment({
      usdBalance: 200,
      copBalance: 200_000,
      monthlyContribution: 420_000,
      investThresholdUsd: 400,
      convertThresholdCop: 150_000,
    });
    expect(result.action).toBe('CONVERT');
    expect(result.details.monthsToThreshold).toBe(2);
  });

  it('returns ACCUMULATE when both balances below threshold', () => {
    const result = evaluateInvestment({ ...base, usdBalance: 100, copBalance: 50_000 });
    expect(result.action).toBe('ACCUMULATE');
    expect(result.urgency).toBe('low');
    expect(result.details.usdNeeded).toBe(300);
  });

  it('uses default thresholds when not provided', () => {
    const result = evaluateInvestment({
      usdBalance: 400,
      copBalance: 0,
      monthlyContribution: 100,
    });
    expect(result.action).toBe('INVEST');
  });

  it('INVEST takes priority over CONVERT even if COP threshold met', () => {
    const result = evaluateInvestment({ ...base, usdBalance: 400, copBalance: 200_000 });
    expect(result.action).toBe('INVEST');
  });

  it('message is a non-empty string for every action', () => {
    const actions = [
      evaluateInvestment({ ...base, usdBalance: 400, copBalance: 0 }),
      evaluateInvestment({ ...base, usdBalance: 0, copBalance: 150_000 }),
      evaluateInvestment({ ...base, usdBalance: 0, copBalance: 0 }),
    ];
    actions.forEach(r => expect(r.message.length).toBeGreaterThan(0));
  });
});
```

- [ ] **Step 4: Run tests — expect FAIL**
```bash
pnpm --filter @finpilot/simulator test
```
Expected: FAIL — "Cannot find module '../src/decision.engine'"

- [ ] **Step 5: Implement decision engine**

Create `packages/simulator/src/decision.engine.ts`:
```typescript
import type { DecisionInput, DecisionOutput } from '@finpilot/types';

export function evaluateInvestment(input: DecisionInput): DecisionOutput {
  const {
    usdBalance,
    copBalance,
    monthlyContribution,
    investThresholdUsd = 400,
    convertThresholdCop = 150_000,
  } = input;

  if (usdBalance >= investThresholdUsd) {
    return {
      action: 'INVEST',
      message: `Tienes $${usdBalance} USD — compra ETFs ahora (VOO/QQQ).`,
      urgency: 'high',
      details: {},
    };
  }

  const APPROX_RATE = 4200; // COP per USD — used only for month estimate, not for actual conversion

  if (copBalance >= convertThresholdCop) {
    const usdNeeded = investThresholdUsd - usdBalance;
    const monthlyUsd = monthlyContribution / APPROX_RATE;
    const months = Math.ceil(usdNeeded / monthlyUsd);
    return {
      action: 'CONVERT',
      message: `Convierte COP a USD. Necesitas ~$${usdNeeded.toFixed(0)} USD más para invertir.`,
      urgency: 'medium',
      details: { usdNeeded: round2(usdNeeded), monthsToThreshold: months },
    };
  }

  const usdNeeded = investThresholdUsd - usdBalance;
  const monthlyUsd = monthlyContribution / APPROX_RATE;
  const months = Math.ceil(usdNeeded / monthlyUsd);
  return {
    action: 'ACCUMULATE',
    message: `Sigue ahorrando. ~${months} mes(es) para alcanzar el umbral de inversión.`,
    urgency: 'low',
    details: { usdNeeded: round2(usdNeeded), monthsToThreshold: months },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
```

- [ ] **Step 6: Run tests — expect PASS**
```bash
pnpm --filter @finpilot/simulator test
```
Expected: All 7 tests PASS.

- [ ] **Step 7: Commit**
```bash
git add packages/simulator/
git commit -m "feat(simulator): add decision engine with tests"
```

---

### Task 5: Investment Simulator

**Files:**
- Create: `packages/simulator/src/investment.simulator.ts`
- Create: `packages/simulator/tests/investment.simulator.test.ts`
- Modify: `packages/simulator/src/index.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/simulator/tests/investment.simulator.test.ts`:
```typescript
import { simulateETFGrowth, compareScenarios, copToUsd } from '../src/investment.simulator';

describe('simulateETFGrowth', () => {
  it('returns correct structure', () => {
    const result = simulateETFGrowth({
      initialBalance: 0,
      monthlyContribution: 50,
      annualReturn: 0.10,
      months: 12,
    });
    expect(result).toHaveProperty('totalInvested');
    expect(result).toHaveProperty('totalValue');
    expect(result).toHaveProperty('profit');
    expect(result).toHaveProperty('profitPercent');
    expect(result.monthlyBreakdown).toHaveLength(12);
  });

  it('totalValue > totalInvested with positive return', () => {
    const result = simulateETFGrowth({
      initialBalance: 1000,
      monthlyContribution: 100,
      annualReturn: 0.10,
      months: 36,
    });
    expect(result.totalValue).toBeGreaterThan(result.totalInvested);
    expect(result.profit).toBeGreaterThan(0);
  });

  it('totalInvested equals initialBalance + (monthlyContribution * months)', () => {
    const result = simulateETFGrowth({
      initialBalance: 500,
      monthlyContribution: 100,
      annualReturn: 0.10,
      months: 12,
    });
    expect(result.totalInvested).toBe(1700); // 500 + 100*12
  });

  it('rounds all values to 2 decimal places', () => {
    const result = simulateETFGrowth({
      initialBalance: 1,
      monthlyContribution: 1,
      annualReturn: 0.10,
      months: 3,
    });
    const hasMax2Decimals = (n: number) => /^\d+(\.\d{1,2})?$/.test(String(n));
    expect(hasMax2Decimals(result.totalValue)).toBe(true);
    expect(hasMax2Decimals(result.profit)).toBe(true);
  });

  it('with 0% return totalValue equals totalInvested', () => {
    const result = simulateETFGrowth({
      initialBalance: 0,
      monthlyContribution: 100,
      annualReturn: 0,
      months: 12,
    });
    expect(result.totalValue).toBe(result.totalInvested);
    expect(result.profit).toBe(0);
  });

  it('handles negative annual return (bear market)', () => {
    const result = simulateETFGrowth({
      initialBalance: 1000,
      monthlyContribution: 100,
      annualReturn: -0.20,
      months: 12,
    });
    expect(result.totalValue).toBeLessThan(result.totalInvested);
    expect(result.profit).toBeLessThan(0);
    expect(result.profitPercent).toBeLessThan(0);
  });

  it('months: 0 returns empty breakdown and profit 0', () => {
    const result = simulateETFGrowth({
      initialBalance: 500,
      monthlyContribution: 100,
      annualReturn: 0.10,
      months: 0,
    });
    expect(result.monthlyBreakdown).toHaveLength(0);
    expect(result.totalInvested).toBe(500);
    expect(result.totalValue).toBe(500);
    expect(result.profit).toBe(0);
  });
});

describe('compareScenarios', () => {
  it('returns one result per scenario', () => {
    const results = compareScenarios(0, 12, [
      { label: 'A', monthlyContribution: 50, annualReturn: 0.08 },
      { label: 'B', monthlyContribution: 100, annualReturn: 0.10 },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].label).toBe('A');
    expect(results[1].label).toBe('B');
  });

  it('higher return produces higher totalValue', () => {
    const [low, high] = compareScenarios(0, 36, [
      { label: 'Low', monthlyContribution: 100, annualReturn: 0.05 },
      { label: 'High', monthlyContribution: 100, annualReturn: 0.15 },
    ]);
    expect(high.totalValue).toBeGreaterThan(low.totalValue);
  });
});

describe('copToUsd', () => {
  it('converts COP to USD with default cost', () => {
    const result = copToUsd({ amountCop: 420_000, exchangeRate: 4200 });
    expect(result.grossUsd).toBe(100);
    expect(result.netUsd).toBeLessThan(100);
    expect(result.costUsd).toBeGreaterThan(0);
  });

  it('applies custom conversion cost', () => {
    const result = copToUsd({ amountCop: 420_000, exchangeRate: 4200, conversionCostPercent: 0.01 });
    expect(result.netUsd).toBe(99);
    expect(result.costUsd).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**
```bash
pnpm --filter @finpilot/simulator test
```
Expected: FAIL — "Cannot find module '../src/investment.simulator'"

- [ ] **Step 3: Implement investment simulator**

Create `packages/simulator/src/investment.simulator.ts`:
```typescript
import type { SimulationInput, SimulationResult, MonthlySnapshot } from '@finpilot/types';

export function simulateETFGrowth(input: SimulationInput): SimulationResult {
  const { initialBalance, monthlyContribution, annualReturn, months } = input;
  const monthlyRate = annualReturn / 12;

  const breakdown: MonthlySnapshot[] = [];
  let totalValue = initialBalance;
  let totalInvested = initialBalance;

  for (let month = 1; month <= months; month++) {
    totalValue = (totalValue + monthlyContribution) * (1 + monthlyRate);
    totalInvested += monthlyContribution;
    breakdown.push({
      month,
      contributed: monthlyContribution,
      totalInvested: round2(totalInvested),
      totalValue: round2(totalValue),
      profit: round2(totalValue - totalInvested),
    });
  }

  const finalInvested = round2(totalInvested);
  const finalValue = round2(totalValue);
  const profit = round2(finalValue - finalInvested);

  return {
    totalInvested: finalInvested,
    totalValue: finalValue,
    profit,
    profitPercent: finalInvested === 0 ? 0 : round2((profit / finalInvested) * 100),
    monthlyBreakdown: breakdown,
  };
}

export interface Scenario {
  label: string;
  monthlyContribution: number;
  annualReturn: number;
}

export function compareScenarios(
  initialBalance: number,
  months: number,
  scenarios: Scenario[],
): Array<SimulationResult & { label: string }> {
  return scenarios.map((s) => ({
    label: s.label,
    ...simulateETFGrowth({ initialBalance, monthlyContribution: s.monthlyContribution, annualReturn: s.annualReturn, months }),
  }));
}

export interface ConversionInput {
  amountCop: number;
  exchangeRate: number;
  conversionCostPercent?: number;
}

export function copToUsd(input: ConversionInput): {
  grossUsd: number;
  netUsd: number;
  costUsd: number;
} {
  const { amountCop, exchangeRate, conversionCostPercent = 0.005 } = input;
  const grossUsd = amountCop / exchangeRate;
  const costUsd = grossUsd * conversionCostPercent;
  return {
    grossUsd: round2(grossUsd),
    netUsd: round2(grossUsd - costUsd),
    costUsd: round2(costUsd),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
```

- [ ] **Step 4: Create src/index.ts**
```typescript
export * from './decision.engine';
export * from './investment.simulator';
```

- [ ] **Step 5: Run all tests — expect PASS**
```bash
pnpm --filter @finpilot/simulator test
```
Expected: All 16 tests PASS (8 decision engine + 8 simulator).

- [ ] **Step 6: Build the package**
```bash
pnpm --filter @finpilot/simulator build
```

- [ ] **Step 7: Commit**
```bash
git add packages/simulator/
git commit -m "feat(simulator): add investment simulator and COP/USD converter"
```

---

## Chunk 3: NestJS API — Setup & Infrastructure

### Task 6: NestJS project scaffold + docker-compose

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/Dockerfile`
- Create: `apps/api/.env.example`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create apps/api/package.json**
```json
{
  "name": "@finpilot/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "test": "jest",
    "test:e2e": "jest --config test/jest-e2e.json",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@finpilot/simulator": "workspace:*",
    "@finpilot/types": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/throttler": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@finpilot/tsconfig": "workspace:*",
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/express": "^4.17.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@types/passport-jwt": "^4.0.0",
    "jest": "^29.7.0",
    "prisma": "^5.0.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.4.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Create apps/api/tsconfig.json**
```json
{
  "extends": "@finpilot/tsconfig/nestjs.json",
  "compilerOptions": {
    "paths": {
      "@finpilot/types": ["../../packages/types/src"],
      "@finpilot/simulator": ["../../packages/simulator/src"]
    }
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: Create apps/api/nest-cli.json**
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 4: Create Dockerfile**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9

# Copy workspace files
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/tsconfig ./packages/tsconfig
COPY packages/types ./packages/types
COPY packages/simulator ./packages/simulator
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @finpilot/types build
RUN pnpm --filter @finpilot/simulator build
RUN pnpm --filter @finpilot/api build

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm@9

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json
COPY --from=builder /app/packages/simulator/dist ./packages/simulator/dist
COPY --from=builder /app/packages/simulator/package.json ./packages/simulator/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

RUN pnpm install --frozen-lockfile --prod

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
```

- [ ] **Step 5: Create .env.example**
```env
DATABASE_URL=postgresql://finpilot:finpilot_dev@localhost:5432/finpilot
JWT_SECRET=change_me_min_32_chars_long_secret_here
JWT_REFRESH_SECRET=change_me_another_32_chars_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
PORT=3001
NODE_ENV=development
WEB_URL=http://localhost:3000
```

- [ ] **Step 6: Create root docker-compose.yml**
```yaml
version: '3.9'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: finpilot
      POSTGRES_USER: finpilot
      POSTGRES_PASSWORD: finpilot_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U finpilot"]
      interval: 5s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    ports:
      - "8080:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@finpilot.local
      PGADMIN_DEFAULT_PASSWORD: admin
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata:
```

- [ ] **Step 7: Copy env and start DB**
```bash
cp apps/api/.env.example apps/api/.env
docker-compose up -d
docker-compose ps
```
Expected: `db` shows `healthy`, `pgadmin` running.

- [ ] **Step 8: Install dependencies**
```bash
pnpm install
```

- [ ] **Step 9: Commit**
```bash
git add apps/api/ docker-compose.yml
git commit -m "chore(api): scaffold NestJS app with Docker Compose"
```

---

### Task 7: Prisma schema + migrations

**Files:**
- Create: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Create schema.prisma**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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
  currency     String
  balance      Decimal       @db.Decimal(18, 2)
  userId       String
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@unique([userId, currency])
}

model Transaction {
  id           String   @id @default(cuid())
  type         TxType
  amount       Decimal  @db.Decimal(18, 2)
  currency     String
  note         String?
  exchangeRate Decimal? @db.Decimal(10, 4)
  walletId     String
  wallet       Wallet   @relation(fields: [walletId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
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
  etfAllocation       Json
  userId              String              @unique
  user                User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  snapshots           PortfolioSnapshot[]
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
}

model PortfolioSnapshot {
  id            String         @id @default(cuid())
  copBalance    Decimal        @db.Decimal(18, 2)
  usdBalance    Decimal        @db.Decimal(18, 2)
  totalValueUsd Decimal        @db.Decimal(18, 2)
  planId        String
  plan          InvestmentPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  takenAt       DateTime       @default(now())
}

model RefreshToken {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2: Generate Prisma client + run migration**
```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
```
Expected: Migration applied, `@prisma/client` generated.

- [ ] **Step 3: Verify DB**
```bash
npx prisma studio
```
Open `http://localhost:5555` — should show all 6 tables.

- [ ] **Step 4: Commit**
```bash
cd ../..
git add apps/api/prisma/
git commit -m "feat(api): add Prisma schema with all domain models"
```

---

### Task 8: NestJS core (AppModule, PrismaService, common)

**Files:**
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/common/filters/http-exception.filter.ts`
- Create: `apps/api/src/common/interceptors/transform.interceptor.ts`
- Create: `apps/api/src/common/decorators/current-user.decorator.ts`
- Create: `apps/api/src/modules/health/health.controller.ts`
- Create: `apps/api/src/modules/health/health.module.ts`

- [ ] **Step 1: Create src/prisma/prisma.service.ts**
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 2: Create src/prisma/prisma.module.ts**
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 3: Create common/filters/http-exception.filter.ts**
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';
    response.status(status).json({ statusCode: status, message, timestamp: new Date().toISOString() });
  }
}
```

- [ ] **Step 4: Create common/interceptors/transform.interceptor.ts**
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
```

- [ ] **Step 5: Create common/decorators/current-user.decorator.ts**
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
);
```

- [ ] **Step 6: Create health module**

`src/modules/health/health.controller.ts`:
```typescript
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  async check(@Res({ passthrough: false }) res: Response) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ok', db: 'ok', timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'error', db: 'unreachable', timestamp: new Date().toISOString() });
    }
  }
}
```

`src/modules/health/health.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

- [ ] **Step 7: Create src/app.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    HealthModule,
    // Auth, Wallets, Plan, Investments, Transactions added in subsequent tasks
  ],
})
export class AppModule {}
```

- [ ] **Step 8: Create src/main.ts**
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // /health excluded from global prefix so K8s probes hit GET /health (not /api/health)
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.enableCors({ origin: process.env.WEB_URL ?? 'http://localhost:3000', credentials: true });
  // WEB_URL must be set in production (e.g. https://finpilot.app) — see .env.example
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

- [ ] **Step 9: Start API and verify health endpoint**
```bash
cd apps/api && pnpm dev
# in another terminal:
curl http://localhost:3001/health
```
Expected: `{"data":{"status":"ok","db":"ok","timestamp":"..."}}`

- [ ] **Step 10: Commit**
```bash
cd ../..
git add apps/api/src/
git commit -m "feat(api): add NestJS core with PrismaService, health endpoint, global pipes"
```

---

## Chunk 4: Auth Module

### Task 9: Auth — Register, Login, Refresh, Logout

**Files:**
- Create: `apps/api/src/modules/users/users.module.ts`
- Create: `apps/api/src/modules/users/users.service.ts`
- Create: `apps/api/src/modules/auth/dto/register.dto.ts`
- Create: `apps/api/src/modules/auth/dto/login.dto.ts`
- Create: `apps/api/src/modules/auth/dto/refresh.dto.ts`
- Create: `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- Create: `apps/api/src/modules/auth/strategies/jwt-refresh.strategy.ts`
- Create: `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/auth.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create DTOs**

`dto/register.dto.ts`:
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;
}
```

`dto/login.dto.ts`:
```typescript
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

`dto/refresh.dto.ts`:
```typescript
import { IsString } from 'class-validator';

export class RefreshDto {
  @IsString()
  refreshToken: string;
}
```

- [ ] **Step 2: Create UsersService**

`users/users.service.ts`:
```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(email: string, password: string, name: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 12);
    return this.prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }
}
```

`users/users.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({ providers: [UsersService], exports: [UsersService] })
export class UsersModule {}
```

- [ ] **Step 3: Create JWT strategies**

`strategies/jwt.strategy.ts`:
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '@finpilot/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
```

`strategies/jwt-refresh.strategy.ts`:
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '@finpilot/types';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: config.getOrThrow('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException();
    return { ...payload, refreshToken };
  }
}
```

`guards/jwt-auth.guard.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 4: Create AuthService**

`auth/auth.service.ts`:
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async register(email: string, password: string, name: string) {
    const user = await this.users.create(email, password, name);
    return this.generateTokens(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.generateTokens(user.id, user.email);
  }

  async refresh(userId: string, rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.userId !== userId || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    await this.prisma.refreshToken.delete({ where: { tokenHash } });
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.generateTokens(user.id, user.email);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow('JWT_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
    });
    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt } });
    return { accessToken, refreshToken: rawToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
```

- [ ] **Step 5: Create AuthController**

`auth/auth.controller.ts`:
```typescript
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, dto.name);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  refresh(@Req() req: any) {
    return this.auth.refresh(req.user.sub, req.user.refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(@CurrentUser() user: { id: string }) {
    return this.auth.logout(user.id);
  }
}
```

- [ ] **Step 6: Create AuthModule**

`auth/auth.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
```

- [ ] **Step 7: Register in AppModule**

In `app.module.ts`, add `AuthModule` to imports:
```typescript
import { AuthModule } from './modules/auth/auth.module';
// ...
imports: [..., AuthModule]
```

- [ ] **Step 8: Test auth endpoints**
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@finpilot.co","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@finpilot.co","password":"password123"}'
```
Expected: Both return `{ data: { accessToken: "...", refreshToken: "..." } }`

- [ ] **Step 9: Commit**
```bash
git add apps/api/src/modules/auth/ apps/api/src/modules/users/ apps/api/src/app.module.ts
git commit -m "feat(api): add auth module with JWT + refresh token (SHA-256 hashed)"
```

---

## Chunk 5: Wallets, Plan, Investments, Transactions

### Task 10: Wallets Module

**Files:**
- Create: `apps/api/src/modules/wallets/dto/deposit.dto.ts`
- Create: `apps/api/src/modules/wallets/dto/convert.dto.ts`
- Create: `apps/api/src/modules/wallets/wallets.service.ts`
- Create: `apps/api/src/modules/wallets/wallets.controller.ts`
- Create: `apps/api/src/modules/wallets/wallets.module.ts`

- [ ] **Step 1: Create DTOs**

`dto/deposit.dto.ts`:
```typescript
import { IsIn, IsNumber, Min } from 'class-validator';

export class DepositDto {
  @IsIn(['COP', 'USD'])
  currency: 'COP' | 'USD';

  @IsNumber()
  @Min(1)
  amount: number;
}
```

`dto/convert.dto.ts`:
```typescript
import { IsNumber, Min } from 'class-validator';

export class ConvertDto {
  @IsNumber()
  @Min(1)
  amountCop: number;

  @IsNumber()
  @Min(100)
  exchangeRate: number;
}
```

- [ ] **Step 2: Create WalletsService**

`wallets.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async getWallets(userId: string) {
    const wallets = await this.prisma.wallet.findMany({ where: { userId } });
    return wallets.map(w => ({ ...w, balance: Number(w.balance) }));
  }

  async getBalance(userId: string, currency: string): Promise<number> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
    return Number(wallet?.balance ?? 0);
  }

  async deposit(userId: string, currency: string, amount: number) {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId_currency: { userId, currency } },
      update: { balance: { increment: new Decimal(amount) } },
      create: { userId, currency, balance: new Decimal(amount) },
    });
    await this.prisma.transaction.create({
      data: { type: 'DEPOSIT', amount: new Decimal(amount), currency, walletId: wallet.id },
    });
    return { ...wallet, balance: Number(wallet.balance) };
  }

  async convert(userId: string, amountCop: number, exchangeRate: number) {
    const grossUsd = amountCop / exchangeRate;
    const costUsd = grossUsd * 0.005; // 0.5% conversion cost
    const netUsd = grossUsd - costUsd;

    const copWallet = await this.prisma.wallet.upsert({
      where: { userId_currency: { userId, currency: 'COP' } },
      update: { balance: { decrement: new Decimal(amountCop) } },
      create: { userId, currency: 'COP', balance: new Decimal(0) },
    });
    const usdWallet = await this.prisma.wallet.upsert({
      where: { userId_currency: { userId, currency: 'USD' } },
      update: { balance: { increment: new Decimal(netUsd) } },
      create: { userId, currency: 'USD', balance: new Decimal(netUsd) },
    });

    await this.prisma.transaction.createMany({
      data: [
        { type: 'CONVERT', amount: new Decimal(amountCop), currency: 'COP', exchangeRate: new Decimal(exchangeRate), walletId: copWallet.id },
        { type: 'CONVERT', amount: new Decimal(netUsd), currency: 'USD', exchangeRate: new Decimal(exchangeRate), walletId: usdWallet.id },
      ],
    });
    return { copDeducted: amountCop, usdReceived: Math.round(netUsd * 100) / 100, exchangeRate };
  }
}
```

- [ ] **Step 3: Create WalletsController**

`wallets.controller.ts`:
```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WalletsService } from './wallets.service';
import { DepositDto } from './dto/deposit.dto';
import { ConvertDto } from './dto/convert.dto';

@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private wallets: WalletsService) {}

  @Get()
  getWallets(@CurrentUser() user: { id: string }) {
    return this.wallets.getWallets(user.id);
  }

  @Post('deposit')
  deposit(@CurrentUser() user: { id: string }, @Body() dto: DepositDto) {
    return this.wallets.deposit(user.id, dto.currency, dto.amount);
  }

  @Post('convert')
  convert(@CurrentUser() user: { id: string }, @Body() dto: ConvertDto) {
    return this.wallets.convert(user.id, dto.amountCop, dto.exchangeRate);
  }
}
```

- [ ] **Step 4: Create WalletsModule + register in AppModule**

`wallets.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({ controllers: [WalletsController], providers: [WalletsService], exports: [WalletsService] })
export class WalletsModule {}
```

Add `WalletsModule` to `app.module.ts` imports.

- [ ] **Step 5: Test wallets**
```bash
TOKEN="<access token from login>"
# Deposit COP
curl -X POST http://localhost:3001/api/wallets/deposit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currency":"COP","amount":500000}'

# Get wallets
curl http://localhost:3001/api/wallets \
  -H "Authorization: Bearer $TOKEN"
```
Expected: Balance updated correctly.

- [ ] **Step 6: Commit**
```bash
git add apps/api/src/modules/wallets/
git commit -m "feat(api): add wallets module with deposit and COP→USD conversion"
```

---

### Task 11: Investment Plan Module

**Files:**
- Create: `apps/api/src/modules/plan/dto/create-plan.dto.ts`
- Create: `apps/api/src/modules/plan/dto/update-plan.dto.ts`
- Create: `apps/api/src/modules/plan/plan.service.ts`
- Create: `apps/api/src/modules/plan/plan.controller.ts`
- Create: `apps/api/src/modules/plan/plan.module.ts`

- [ ] **Step 1: Create DTOs**

`dto/create-plan.dto.ts`:
```typescript
import { IsNumber, IsObject, IsOptional, Min } from 'class-validator';
import { EtfAllocationSchema } from '@finpilot/types';
import { Transform } from 'class-transformer';

export class CreatePlanDto {
  @IsNumber()
  @Min(1)
  monthlyContribution: number;

  @IsNumber()
  @IsOptional()
  investThresholdUsd?: number;

  @IsNumber()
  @IsOptional()
  convertThresholdCop?: number;

  @IsObject()
  @Transform(({ value }) => {
    const parsed = EtfAllocationSchema.safeParse(value);
    if (!parsed.success) throw new Error('ETF allocation must sum to 100');
    return parsed.data;
  })
  etfAllocation: Record<string, number>;
}
```

`dto/update-plan.dto.ts`:
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanDto } from './create-plan.dto';

export class UpdatePlanDto extends PartialType(CreatePlanDto) {}
```

- [ ] **Step 2: Create PlanService**

`plan.service.ts`:
```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

  async get(userId: string) {
    const plan = await this.prisma.investmentPlan.findUnique({ where: { userId } });
    if (!plan) throw new NotFoundException('No investment plan found');
    return this.toDto(plan);
  }

  async create(userId: string, dto: CreatePlanDto) {
    const existing = await this.prisma.investmentPlan.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Plan already exists. Use PUT to update.');
    const plan = await this.prisma.investmentPlan.create({
      data: {
        userId,
        monthlyContribution: new Decimal(dto.monthlyContribution),
        investThresholdUsd: new Decimal(dto.investThresholdUsd ?? 400),
        convertThresholdCop: new Decimal(dto.convertThresholdCop ?? 150_000),
        etfAllocation: dto.etfAllocation,
      },
    });
    return this.toDto(plan);
  }

  async update(userId: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.investmentPlan.update({
      where: { userId },
      data: {
        ...(dto.monthlyContribution !== undefined && { monthlyContribution: new Decimal(dto.monthlyContribution) }),
        ...(dto.investThresholdUsd !== undefined && { investThresholdUsd: new Decimal(dto.investThresholdUsd) }),
        ...(dto.convertThresholdCop !== undefined && { convertThresholdCop: new Decimal(dto.convertThresholdCop) }),
        ...(dto.etfAllocation !== undefined && { etfAllocation: dto.etfAllocation }),
      },
    });
    return this.toDto(plan);
  }

  private toDto(plan: any) {
    return {
      id: plan.id,
      monthlyContribution: Number(plan.monthlyContribution),
      investThresholdUsd: Number(plan.investThresholdUsd),
      convertThresholdCop: Number(plan.convertThresholdCop),
      etfAllocation: plan.etfAllocation,
    };
  }
}
```

- [ ] **Step 3: Create PlanController + PlanModule**

`plan.controller.ts`:
```typescript
import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@UseGuards(JwtAuthGuard)
@Controller('plan')
export class PlanController {
  constructor(private plan: PlanService) {}

  @Get()
  get(@CurrentUser() user: { id: string }) { return this.plan.get(user.id); }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreatePlanDto) {
    return this.plan.create(user.id, dto);
  }

  @Put()
  update(@CurrentUser() user: { id: string }, @Body() dto: UpdatePlanDto) {
    return this.plan.update(user.id, dto);
  }
}
```

`plan.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';

@Module({ controllers: [PlanController], providers: [PlanService], exports: [PlanService] })
export class PlanModule {}
```

Add `PlanModule` to `app.module.ts`.

- [ ] **Step 4: Commit**
```bash
git add apps/api/src/modules/plan/
git commit -m "feat(api): add investment plan module (CRUD)"
```

---

### Task 12: Investments & Transactions Modules

**Files:**
- Create: `apps/api/src/modules/investments/investments.service.ts`
- Create: `apps/api/src/modules/investments/investments.controller.ts`
- Create: `apps/api/src/modules/investments/investments.module.ts`
- Create: `apps/api/src/modules/transactions/dto/create-transaction.dto.ts`
- Create: `apps/api/src/modules/transactions/transactions.service.ts`
- Create: `apps/api/src/modules/transactions/transactions.controller.ts`
- Create: `apps/api/src/modules/transactions/transactions.module.ts`

- [ ] **Step 1: Create InvestmentsService**

`investments/investments.service.ts`:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { evaluateInvestment, simulateETFGrowth, compareScenarios } from '@finpilot/simulator';

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) {}

  async getRecommendation(userId: string) {
    const [plan, copWallet, usdWallet] = await Promise.all([
      this.prisma.investmentPlan.findUnique({ where: { userId } }),
      this.prisma.wallet.findUnique({ where: { userId_currency: { userId, currency: 'COP' } } }),
      this.prisma.wallet.findUnique({ where: { userId_currency: { userId, currency: 'USD' } } }),
    ]);
    if (!plan) throw new NotFoundException('Create an investment plan first');
    return evaluateInvestment({
      usdBalance: Number(usdWallet?.balance ?? 0),
      copBalance: Number(copWallet?.balance ?? 0),
      monthlyContribution: Number(plan.monthlyContribution),
      investThresholdUsd: Number(plan.investThresholdUsd),
      convertThresholdCop: Number(plan.convertThresholdCop),
    });
  }

  async simulate(userId: string, months = 36) {
    const [plan, usdWallet] = await Promise.all([
      this.prisma.investmentPlan.findUnique({ where: { userId } }),
      this.prisma.wallet.findUnique({ where: { userId_currency: { userId, currency: 'USD' } } }),
    ]);
    if (!plan) throw new NotFoundException('Create an investment plan first');
    return simulateETFGrowth({
      initialBalance: Number(usdWallet?.balance ?? 0),
      monthlyContribution: Number(plan.monthlyContribution) / 4200, // COP to USD approx
      annualReturn: 0.10,
      months,
    });
  }

  async scenarios(userId: string) {
    const [plan, usdWallet] = await Promise.all([
      this.prisma.investmentPlan.findUnique({ where: { userId } }),
      this.prisma.wallet.findUnique({ where: { userId_currency: { userId, currency: 'USD' } } }),
    ]);
    if (!plan) throw new NotFoundException('Create an investment plan first');
    const monthlyUsd = Number(plan.monthlyContribution) / 4200;
    const initial = Number(usdWallet?.balance ?? 0);
    return compareScenarios(initial, 36, [
      { label: 'Conservador (8.5% EA)', monthlyContribution: monthlyUsd, annualReturn: 0.085 },
      { label: 'Base S&P500 (10% EA)', monthlyContribution: monthlyUsd, annualReturn: 0.10 },
      { label: 'Agresivo QQQ (12% EA)', monthlyContribution: monthlyUsd, annualReturn: 0.12 },
    ]);
  }
}
```

- [ ] **Step 2: Create InvestmentsController + Module**

`investments/investments.controller.ts`:
```typescript
import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InvestmentsService } from './investments.service';

@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(private investments: InvestmentsService) {}

  @Get('recommendation')
  recommendation(@CurrentUser() user: { id: string }) {
    return this.investments.getRecommendation(user.id);
  }

  @Get('simulate')
  simulate(
    @CurrentUser() user: { id: string },
    @Query('months', new DefaultValuePipe(36), ParseIntPipe) months: number,
  ) {
    return this.investments.simulate(user.id, months);
  }

  @Get('scenarios')
  scenarios(@CurrentUser() user: { id: string }) {
    return this.investments.scenarios(user.id);
  }
}
```

`investments/investments.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';

@Module({ controllers: [InvestmentsController], providers: [InvestmentsService] })
export class InvestmentsModule {}
```

- [ ] **Step 3: Create TransactionsModule**

`transactions/dto/create-transaction.dto.ts`:
```typescript
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsIn(['DEPOSIT', 'WITHDRAWAL', 'CONVERT', 'INVEST'])
  type: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsIn(['COP', 'USD'])
  currency: string;

  @IsString()
  @IsOptional()
  note?: string;
}
```

`transactions/transactions.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, page = 1, limit = 20) {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { wallet: { userId } },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.transaction.count({ where: { wallet: { userId } } }),
    ]);
    return {
      data: data.map(t => ({ ...t, amount: Number(t.amount), exchangeRate: t.exchangeRate ? Number(t.exchangeRate) : undefined })),
      total,
      page,
      limit: take,
    };
  }
}
```

`transactions/transactions.controller.ts`:
```typescript
import { Controller, Get, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private txs: TransactionsService) {}

  @Get()
  list(
    @CurrentUser() user: { id: string },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.txs.list(user.id, page, limit);
  }
}
```

`transactions/transactions.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({ controllers: [TransactionsController], providers: [TransactionsService] })
export class TransactionsModule {}
```

- [ ] **Step 4: Register all new modules in AppModule**

Final `app.module.ts` imports:
```typescript
imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  PrismaModule,
  HealthModule,
  AuthModule,
  WalletsModule,
  PlanModule,
  InvestmentsModule,
  TransactionsModule,
]
```

- [ ] **Step 5: Full API smoke test**
```bash
TOKEN="<access token>"
# Create plan
curl -X POST http://localhost:3001/api/plan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"monthlyContribution":400000,"etfAllocation":{"VOO":70,"QQQ":30}}'

# Get recommendation
curl http://localhost:3001/api/investments/recommendation \
  -H "Authorization: Bearer $TOKEN"

# Get simulation
curl "http://localhost:3001/api/investments/simulate?months=36" \
  -H "Authorization: Bearer $TOKEN"

# Get transactions
curl "http://localhost:3001/api/transactions?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```
Expected: All return valid JSON with `{ data: ... }` envelope.

- [ ] **Step 6: Commit**
```bash
git add apps/api/src/modules/investments/ apps/api/src/modules/transactions/ apps/api/src/app.module.ts
git commit -m "feat(api): add investments (recommendation + simulator + scenarios) and transactions modules"
```

---

## Chunk 6: Docker Build Verification

### Task 13: Build and run API in Docker

**Goal:** Verify the Docker image builds correctly and the API runs containerized.

- [ ] **Step 1: Build Docker image**
```bash
docker build -f apps/api/Dockerfile -t finpilot-api:dev .
```
Expected: Build completes successfully (may take 2-3 min first time).

- [ ] **Step 2: Run container against docker-compose DB**
```bash
docker run --rm \
  --network finpilot_default \
  -e DATABASE_URL="postgresql://finpilot:finpilot_dev@db:5432/finpilot" \
  -e JWT_SECRET="test_secret_32_chars_long_xxxxxxx" \
  -e JWT_REFRESH_SECRET="test_refresh_32_chars_long_xxxxxx" \
  -p 3002:3001 \
  finpilot-api:dev
```
Expected: API starts on port 3002, migrations run.

- [ ] **Step 3: Health check on containerized API**
```bash
curl http://localhost:3002/health
```
Expected: `{"data":{"status":"ok","db":"ok","timestamp":"..."}}`

- [ ] **Step 4: Final commit**
```bash
git add .
git commit -m "chore: verify Docker build for API"
```

---

## Done — Plan 1 Complete

After completing all tasks, the following is working:
- Turborepo monorepo with pnpm
- `packages/types` — shared DTOs
- `packages/simulator` — decision engine + ETF simulator (fully tested)
- `apps/api` — NestJS API with auth, wallets, plan, investments, transactions
- Local dev: `docker-compose up` + `pnpm dev`
- Docker image builds and runs

**Next:** See Plan 2 (Next.js frontend) and Plan 3 (K8s + ArgoCD + Terraform).

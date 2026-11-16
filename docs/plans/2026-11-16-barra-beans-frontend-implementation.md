# Barra Bean Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let Barra staff count the nine beans in kilograms, review history and share complete stock; let managers manage menu links.

**Architecture:** Separate bean domain/client/pending modules and fixed BFF routes, integrated into existing StockApp authentication. Exact integer grams internally, UID-scoped durable pending operations, fresh authoritative snapshots after writes. Small additive backend snapshot supplies safe menu names/configuration metadata.

**Tech Stack:** Next 16, React 19, TypeScript, Firebase auth, Go HTTP backend.

---

### Task 1: Domain and recovery contract
Create src/bean-stock/{types,model,client,pending,share}.ts and tests/bean-stock/*.test.ts. Write failing tests for decimal precision, unknown/zero, overdraw, full share, UID guard and exact pending recovery; run tsx --test before implementation, implement and repeat. No integer stock refactor.

### Task 2: Staff-readable menu metadata
Modify backend internal/http/bean_stock.go and tests plus docs/openapi.yaml. Add complete menu_items and links snapshot without private fields or permission escalation. Test manual availability versus effective stock and role restrictions; run go test ./internal/http ./internal/beanstock. Regenerate frontend src/api/schema.ts.

### Task 3: BFF routes
Create src/server/bean-stock-proxy.ts and app/api/barra-stock/beans routes for list/count/history/links. Test strict bean IDs and pagination, bearer forwarding/no-store, upstream errors and menu cache invalidation. Reject unknown query fields.

### Task 4: Approved interface
Create BeanWorkspace.tsx and bean-stock.css, minimally modify StockApp.tsx. Productos/Granos navigation, dense list, exact decimal editor, history pagination, role-aware links, complete copy/WhatsApp report. UID-guard all late callbacks and preserve durable operations through ambiguous errors/reauth. Conflict requires fresh read and review; success receipt separate from authoritative snapshot. Test rendered semantics and browser interaction against controlled API/auth and real backend where possible.

### Task 5: Verification and actual render handoff
Run new bean tests and old stock/menu/routing regressions, npm run typecheck and npm run build. Inspect local app at 320/375/390/430/1440 widths and test save/conflict/recovery/roles/share. Port actual mobile/desktop renders to Paper and show screenshots. No deployment until explicit actual-render approval. Preserve unrelated untracked files and credentials.

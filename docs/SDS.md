# Software Design Specification (SDS)
## Complaint Management System (CMS)

**Client:** Ministry of Planning and Development (MoPD), Federal Democratic Republic of Ethiopia  
**Project:** MoPD Complaint Management System (Web + Mobile-First PWA)  
**Version:** 0.1 (Draft)  
**Date:** 29 March 2026  
**Prepared by:** Abiy Hailu Getachew  
**Baseline Documents:** MoPD CMS SOW (24 March 2026), MoPD CMS SRS v0.1 (26 March 2026)

---

## Document Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| MoPD Project Owner / Sponsor | TBD | TBD | TBD |
| MoPD ICT Director | TBD | TBD | TBD |
| Vendor Technical Lead / Architect | TBD | TBD | TBD |
| Vendor Project Manager | TBD | TBD | TBD |
| Security Lead | TBD | TBD | TBD |
| Accessibility Lead | TBD | TBD | TBD |

---

## Revision History

| Version | Date | Author | Description |
|---|---|---|---|
| 0.1 | 29 March 2026 | Abiy Hailu Getachew | Initial draft based on SOW and SRS v0.1 |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Architecture Decision Records](#2-architecture-decision-records)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Technology Stack](#4-technology-stack)
5. [Component Design](#5-component-design)
6. [Data Design](#6-data-design)
7. [API Design](#7-api-design)
8. [Security Design](#8-security-design)
9. [Accessibility Design](#9-accessibility-design)
10. [Localization and Internationalization Design](#10-localization-and-internationalization-design)
11. [Integration Design](#11-integration-design)
12. [Infrastructure and Deployment Design](#12-infrastructure-and-deployment-design)
13. [Performance and Scalability Design](#13-performance-and-scalability-design)
14. [Observability Design](#14-observability-design)
15. [Error Handling Strategy](#15-error-handling-strategy)
16. [Testing Strategy](#16-testing-strategy)
17. [Appendices](#17-appendices)

---

## Definitions, Acronyms, and Abbreviations

| Term | Definition |
|---|---|
| CMS | Complaint Management System |
| MoPD | Ministry of Planning and Development |
| SDS | Software Design Specification |
| SRS | Software Requirements Specification |
| SOW | Statement of Work |
| RBAC | Role-Based Access Control |
| SLA | Service Level Agreement |
| SSO | Single Sign-On |
| OIDC | OpenID Connect |
| SAML | Security Assertion Markup Language |
| PWA | Progressive Web Application |
| DPO | Data Protection Officer |
| ASVS | OWASP Application Security Verification Standard |
| WCAG | Web Content Accessibility Guidelines |
| ISMS | Information Security Management System |
| DTO | Data Transfer Object |
| ORM | Object-Relational Mapping |
| RLS | Row-Level Security |
| BFF | Backend for Frontend |
| CDC | Change Data Capture |
| CQRS | Command Query Responsibility Segregation |

<div style="page-break-after: always;"></div>

# 1. Introduction

## 1.1 Purpose

This Software Design Specification defines the architectural decisions, component designs, data models, API contracts, security controls, and infrastructure plans for the MoPD Complaint Management System. It translates the requirements documented in the SRS (v0.1, 26 March 2026) into an implementable technical design.

This document serves as:
- the contract between architecture and implementation teams,
- the basis for detailed sprint-level design and development,
- the reference for security, accessibility, and compliance reviews,
- and the foundation for infrastructure provisioning and deployment planning.

## 1.2 Scope

This SDS covers the full technical design of the CMS as scoped in the SOW and SRS, including:
- backend services (API, workflow engine, notification dispatcher, job scheduler),
- frontend application (public citizen portal, internal staff portal, admin dashboard),
- database schema and data access layer,
- external integrations (SMS, email, SSO, chatbot),
- security architecture and controls,
- deployment topology and CI/CD pipeline,
- and observability and operations infrastructure.

## 1.3 Referenced Documents

| ID | Document | Version / Date |
|---|---|---|
| REF-01 | MoPD CMS Statement of Work | 24 March 2026 |
| REF-02 | MoPD CMS Software Requirements Specification | v0.1, 26 March 2026 |
| REF-03 | OWASP ASVS v5.0 | Current |
| REF-04 | ISO/IEC 27001:2022 | Current |
| REF-05 | WCAG 2.2 (W3C Recommendation) | Current |
| REF-06 | Personal Data Protection Proclamation No. 1321/2024 (Ethiopia) | Current |
| REF-07 | Digital Identification Proclamation No. 1284/2023 (Ethiopia) | Current |

## 1.4 Design Principles

The following principles govern all design decisions in this document:

1. **API-First**: All functionality is exposed through versioned REST APIs before any UI is built. The API contract is the source of truth.
2. **Security by Design**: Authentication, authorization, input validation, and audit logging are embedded in every layer, not retrofitted.
3. **Privacy by Design**: Data minimization, consent management, and retention controls are architectural first-class citizens.
4. **Accessibility by Design**: WCAG 2.2 AA conformance is a design constraint, not a post-hoc fix.
5. **Mobile-First**: All public interfaces are designed for constrained devices and networks (3G baseline).
6. **Modularity**: Each functional domain is an independent module with clear boundaries, enabling parallel development and isolated testing.
7. **Auditability**: Every state-changing operation produces an immutable audit record.
8. **Stateless Services**: Backend services hold no session state; all state lives in PostgreSQL or Redis.

<div style="page-break-after: always;"></div>

# 2. Architecture Decision Records

## ADR-001: Backend Framework — NestJS

### Context

The CMS requires a backend framework that supports modular architecture for 9+ functional modules, complex RBAC with 10+ roles, background job processing for SLA timers and notification dispatch, auto-generated API documentation, and enterprise-grade dependency injection for testability.

### Decision

**NestJS** (TypeScript, Node.js) is selected as the backend framework.

### Rationale

| Criterion | NestJS | Django (Best Alternative) |
|---|---|---|
| Modular architecture | Native module system maps 1:1 to CMS functional modules | Django apps are modular but less structured |
| TypeScript end-to-end | Shared types/DTOs with Next.js frontend | Python backend + TypeScript frontend = contract mismatch risk |
| RBAC implementation | Guards + decorators (`@Roles('CaseOfficer')`) | DRF permissions + mixins |
| Background jobs | BullMQ (Redis-backed, first-class support) | Celery (more mature, but separate broker) |
| API documentation | Auto-generated OpenAPI/Swagger from decorators | DRF + drf-spectacular |
| Dependency injection | Built-in IoC container | No built-in DI |
| Async I/O | Native (Node.js event loop) | Improving but not native |
| Team familiarity | High | Low |
| Government track record | Growing adoption | Proven |
| Admin panel | Must build (needed anyway for custom RBAC UI) | Built-in Django Admin |
| Security defaults | Helmet, CSRF, rate limiting (plugins) | Excellent built-in |

### Consequences

- **Positive**: TypeScript end-to-end, modular code organization, excellent testability via DI, native async for SMS/email integrations, auto-generated API docs.
- **Negative**: No built-in admin panel (mitigated by custom admin dashboard requirement in SOW), BullMQ is less mature than Celery (mitigated by Redis reliability).
- **Risk mitigation**: Security gap vs. Django mitigated by mandatory Helmet, CSRF middleware, and OWASP ASVS L2 verification checklist.

### Status

**Accepted**

---

## ADR-002: Frontend Framework — Next.js

### Context

The CMS frontend must deliver sub-3-second P95 page loads on 3G networks, support bilingual Amharic/English with dynamic locale switching, conform to WCAG 2.2 AA, and operate as a PWA with optional Android wrapper.

### Decision

**Next.js** (React, TypeScript) with App Router and Server Components is selected as the frontend framework.

### Rationale

| Criterion | Next.js | Angular (Alternative) |
|---|---|---|
| SSR for 3G performance | RSC + streaming SSR | Universal (SSR) supported |
| Bundle size (mobile) | Server Components reduce client JS | Heavier baseline bundle |
| PWA support | next-pwa plugin | @angular/pwa |
| i18n for Amharic/English | next-intl with App Router | Built-in i18n (more mature) |
| React ecosystem (dashboards) | Recharts, Tremor, Radix UI | Angular Material, PrimeNG |
| TypeScript consistency | Shared with NestJS backend | Shared with NestJS backend |
| Developer availability | Larger pool | Smaller pool |
| Learning curve | Moderate | Steeper |

### Consequences

- **Positive**: Best SSR performance for constrained networks, large component ecosystem, TypeScript consistency with backend, strong PWA support.
- **Negative**: Self-hosting requires Node.js runtime (not static files), Amharic font rendering needs custom font-face stacking, App Router patterns still maturing.

### Status

**Accepted**

---

## ADR-003: Database — PostgreSQL

### Context

The system requires relational data with complex queries (workflow state machines, SLA calculations, audit trails), row-level security for multi-tenant data isolation, encryption at rest, and full-text search for complaint records.

### Decision

**PostgreSQL 16+** is selected as the primary database.

### Rationale

- Mature, enterprise-grade RDBMS with proven government deployment history.
- Native row-level security (RLS) policies for RBAC enforcement at the database layer.
- `pgcrypto` for encryption at rest and field-level encryption of sensitive data.
- Full-text search with `tsvector` for Amharic and English complaint search.
- JSONB columns for flexible metadata (complaint categories, custom fields).
- Excellent Prisma ORM support for NestJS.
- Supports logical replication for read replicas (scalability path).

### Status

**Accepted**

---

## ADR-004: ORM — Prisma

### Context

The data access layer needs type-safe queries, automated migration management across Dev/Test/UAT/Prod environments, and compatibility with PostgreSQL features including RLS.

### Decision

**Prisma** is selected as the ORM with raw SQL escape hatches for advanced PostgreSQL features (RLS policies, full-text search, stored procedures).

### Rationale

- Auto-generated TypeScript types from database schema ensure compile-time safety.
- Declarative schema file (`schema.prisma`) serves as the single source of truth for the data model.
- Migration system supports controlled, reviewable schema evolution.
- Prisma Client generates optimized SQL; raw queries available for complex operations.
- Strong NestJS integration via `@prisma/client`.

### Status

**Accepted**

---

## ADR-005: Cache and Job Queue — Redis + BullMQ

### Context

The system requires: (a) session-adjacent caching for RBAC permission lookups and frequently accessed reference data, (b) a reliable job queue for SLA timer monitoring, notification dispatch, report generation, and file scanning orchestration.

### Decision

**Redis 7+** for caching and as the backing store for **BullMQ** job queues.

### Rationale

- Single infrastructure dependency (Redis) serves both caching and queue needs.
- BullMQ provides job scheduling (cron-like SLA checks), retries with exponential backoff, rate limiting, and priority queues.
- Redis pub/sub can power real-time dashboard updates.
- Redis TTL-based expiry for session tokens and permission cache invalidation.

### Status

**Accepted**

---

## ADR-006: File Storage — MinIO (S3-Compatible)

### Context

Complaint attachments, evidence files, exported reports, and document templates need secure, policy-driven storage with virus scanning, retention controls, and authorized export.

### Decision

**MinIO** (S3-compatible object storage) for self-hosted environments; AWS S3 if cloud-hosted.

### Rationale

- S3-compatible API ensures portability between on-prem and cloud.
- Bucket policies and pre-signed URLs enforce authorized access without exposing storage credentials.
- Integrates with ClamAV for virus scanning via a processing pipeline.
- Lifecycle policies enforce retention and auto-deletion schedules.
- Government on-prem hosting requirement met by MinIO's self-hosted model.

### Status

**Accepted**

<div style="page-break-after: always;"></div>

# 3. System Architecture Overview

## 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL ACTORS                                │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Citizen  │  │  Email   │  │ Ethio    │  │   Gov    │  │  USSD    │  │
│  │ (Browser/ │  │  Server  │  │ Telecom  │  │   SSO    │  │ Gateway  │  │
│  │  Mobile)  │  │  (SMTP)  │  │ SMS API  │  │ (OIDC)   │  │          │  │
│  └─────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬────┘  └──────┬───┘  │
└────────┼─────────────┼─────────────┼──────────────┼──────────────┼──────┘
         │             │             │              │              │
    ┌────▼────────────────────────────────────────────────────────────┐
    │                      REVERSE PROXY / WAF                        │
    │                   (Nginx + ModSecurity / Cloudflare)            │
    │          TLS termination, rate limiting, IP filtering           │
    └────┬────────────────────────────────────────────────────────────┘
         │
    ┌────▼────────────────────────────────────────────────────────────┐
    │                       FRONTEND TIER                             │
    │  ┌───────────────────────────────────────────────────────────┐  │
    │  │               Next.js Application (SSR)                   │  │
    │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
    │  │  │  Public  │  │  Staff   │  │  Admin   │  │ Chatbot  │   │  │
    │  │  │  Portal  │  │  Portal  │  │ Dashboard│  │    UI    │   │  │
    │  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
    │  └───────────────────────────────────────────────────────────┘  │
    └────┬────────────────────────────────────────────────────────────┘
         │ HTTPS (JSON)
    ┌────▼────────────────────────────────────────────────────────────┐
    │                       API GATEWAY TIER                          │
    │           NestJS API Gateway (versioned: /api/v1/*)             │
    │     ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
    │     │   Auth   │  │   Rate   │  │  Request │  │  Audit   │      │
    │     │  Guard   │  │  Limiter │  │ Validator│  │  Logger  │      │
    │     └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
    └────┬────────────────────────────────────────────────────────────┘
         │
    ┌────▼────────────────────────────────────────────────────────────┐
    │                    BACKEND SERVICE TIER                         │
    │  ┌─────────────────────────────────────────────────────────┐    │
    │  │                    NestJS Application                   │    │
    │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │    │
    │  │  │   Auth   │  │Complaint │  │ Workflow │               │    │
    │  │  │  Module  │  │  Module  │  │  Engine  │               │    │
    │  │  │   User   │  │   Case   │  │   SLA    │               │    │
    │  │  │  Module  │  │  Module  │  │  Module  │               │    │
    │  │  ├──────────┤  ├──────────┤  ├──────────┤               │    │
    │  │  │Notif-    │  │ Report   │  │  Chatbot │               │    │
    │  │  │ication   │  │  Module  │  │  Module  │               │    │
    │  │  ├──────────┤  ├──────────┤  ├──────────┤               │    │
    │  │  │  Audit   │  │ Document │  │  Admin   │               │    │
    │  │  │  Module  │  │  Module  │  │  Module  │               │    │
    │  │  └──────────┘  └──────────┘  └──────────┘               │    │
    │  │  ├──────────┤  ├──────────┤  ├──────────┤               │    │
    │  └─────────────────────────────────────────────────────────┘    │
    └────┬────────────┬─────────────┬─────────────────────────────────┘
         │            │             │
    ┌────▼─────┐ ┌────▼─────┐ ┌─────▼────┐  ┌──────────────────────┐
    │PostgreSQL│ │  Redis   │ │  MinIO   │  │  Background Workers  │
    │  (Data)  │ │ (Cache/  │ │ (Files)  │  │  (BullMQ Processors) │
    │          │ │  Queue)  │ │          │  │  - SLA Monitor       │
    │  - RLS   │ │  - Cache │ │  - Virus │  │  - Notification Tx   │
    │  - Audit │ │  - Jobs  │ │    Scan  │  │  - Report Generator  │
    │  - FTS   │ │  - PubSub│ │  - Retain│  │  - Email Ingestion   │
    └──────────┘ └──────────┘ └──────────┘  └──────────────────────┘
```

## 3.2 Architectural Style

The system follows a **modular monolith** architecture with clear module boundaries that can be decomposed into microservices if scaling demands it in the future. This is the optimal starting point because:

- The team size and timeline (MVP in 8-10 weeks) do not justify microservice overhead.
- A well-structured modular monolith with NestJS modules provides the same logical separation as microservices without network complexity.
- Module communication happens via injected services, not HTTP calls, reducing latency and failure modes.
- If a specific module (e.g., Notification) needs independent scaling, it can be extracted into a standalone NestJS service communicating via Redis/BullMQ.

## 3.3 Layer Architecture

Each NestJS module follows a strict layered architecture:

```
┌─────────────────────────────────────────┐
│            Controller Layer             │
│  HTTP handling, request validation,     │
│  response serialization, Swagger docs   │
├─────────────────────────────────────────┤
│             Service Layer               │
│  Business logic, workflow rules,        │
│  orchestration, authorization checks    │
├─────────────────────────────────────────┤
│           Repository Layer              │
│  Data access via Prisma, raw SQL        │
│  for complex queries, caching logic     │
├─────────────────────────────────────────┤
│          Infrastructure Layer           │
│  External integrations (SMS, email,     │
│  file storage, SSO), job dispatching    │
└─────────────────────────────────────────┘
```

**Dependency rule**: Each layer may only depend on the layer directly below it. Controllers never access repositories directly; services never call HTTP endpoints directly.

<div style="page-break-after: always;"></div>

# 4. Technology Stack

## 4.1 Complete Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | Next.js | 15.x | SSR, App Router, React Server Components |
| **Frontend UI** | React | 19.x | Component framework |
| **Frontend Styling** | Tailwind CSS | 4.x | Utility-first CSS, WCAG-friendly theming |
| **Frontend Components** | Radix UI + shadcn/ui | Latest | Accessible, unstyled primitives |
| **Frontend Forms** | React Hook Form + Zod | Latest | Validation with TypeScript inference |
| **Frontend i18n** | next-intl | Latest | Amharic/English locale routing and messages |
| **Frontend Charts** | Recharts / Tremor | Latest | Dashboard analytics visualizations |
| **Frontend State** | TanStack Query (React Query) | 5.x | Server state management, caching, sync |
| **Frontend Date** | Temporal API polyfill + ethiopic-calendar | - | Ethiopian calendar date display |
| **Backend** | NestJS | 11.x | Modular backend framework |
| **Backend Runtime** | Node.js | 22.x LTS | JavaScript runtime |
| **Backend Language** | TypeScript | 5.x | Shared type system with frontend |
| **ORM** | Prisma | 6.x | Type-safe database access and migrations |
| **Validation** | class-validator + class-transformer | Latest | DTO validation in NestJS |
| **API Docs** | @nestjs/swagger | Latest | OpenAPI 3.0 auto-generation |
| **Auth** | Passport.js (@nestjs/passport) | Latest | JWT, OIDC, SAML strategies |
| **Auth Tokens** | JWT (access) + Secure HTTP-only cookie (refresh) | - | Stateless auth with refresh rotation |
| **Database** | PostgreSQL | 16+ | Primary relational store |
| **Cache / Broker** | Redis | 7+ | Cache, job queue backing, pub/sub |
| **Job Queue** | BullMQ | Latest | Background job processing |
| **File Storage** | MinIO (on-prem) / S3 (cloud) | Latest | S3-compatible object storage |
| **Virus Scanning** | ClamAV | Latest | Attachment malware scanning |
| **Email** | Nodemailer | Latest | SMTP email dispatch |
| **SMS** | Ethio Telecom API (custom adapter) | - | Transactional SMS and OTP |
| **Chatbot NLP** | Rasa Open Source / custom intent matcher | Latest | Bilingual FAQ chatbot engine |
| **Search** | PostgreSQL FTS (`tsvector`) | Built-in | Full-text search across complaints |
| **Monitoring** | Prometheus + Grafana | Latest | Metrics collection and dashboarding |
| **Logging** | Pino (structured JSON) + Loki | Latest | Centralized log aggregation |
| **Alerting** | Grafana Alerting / Alertmanager | Latest | SLA and incident alerts |
| **CI/CD** | GitLab CI (or GitHub Actions) | Latest | Build, test, deploy pipelines |
| **Containers** | Docker + Docker Compose (dev) | Latest | Containerized services |
| **Orchestration** | Docker Compose (initial) / Kubernetes (scale) | Latest | Service orchestration |
| **IaC** | Terraform (if cloud) / Ansible (if on-prem) | Latest | Infrastructure as Code |
| **Secrets** | HashiCorp Vault / Docker Secrets | Latest | Secrets management |
| **Testing** | Jest + Supertest (backend), Playwright (E2E) | Latest | Unit, integration, E2E testing |
| **Linting** | ESLint + Prettier | Latest | Code quality enforcement |

## 4.2 TypeScript Shared Types Strategy

A key advantage of the NestJS + Next.js stack is shared TypeScript types. The project uses a monorepo structure with a shared `packages/shared` library:

```
mopd-cms/
├── apps/
│   ├── api/                    # NestJS backend
│   └── web/                    # Next.js frontend
├── packages/
│   └── shared/                 # Shared TypeScript types
│       ├── src/
│       │   ├── dto/            # Request/response DTOs
│       │   ├── enums/          # Shared enumerations
│       │   ├── interfaces/     # Entity interfaces
│       │   └── constants/      # Shared constants
│       ├── package.json
│       └── tsconfig.json
├── package.json                # Workspace root
├── turbo.json                  # Turborepo config
└── tsconfig.base.json
```

This ensures:
- Complaint status enums are defined once and used in both API validation and frontend state machines.
- API response types are shared, eliminating manual synchronization.
- Role and permission constants are consistent across the stack.

<div style="page-break-after: always;"></div>

# 5. Component Design

## 5.1 Module Inventory

The NestJS backend is organized into the following modules, each mapping to SRS functional requirement sets:

| Module | SRS Mapping | Responsibility |
|---|---|---|
| `AuthModule` | FR-01 (partial) | Authentication (JWT, SSO), token management, session security |
| `UserModule` | FR-01 | User CRUD, role assignment, permission matrix, team management |
| `ComplaintModule` | FR-02 | Complaint intake, registration, reference generation, channel ingestion |
| `WorkflowModule` | FR-03 | State machine engine, transitions, escalations, appeals |
| `SlaModule` | FR-04 | SLA configuration, timer tracking, breach detection, alerts |
| `CaseModule` | FR-05 | Internal notes, tasks, mentions, evidence, version history |
| `NotificationModule` | FR-06 | Template management, email/SMS dispatch, delivery tracking |
| `ChatbotModule` | FR-07 | FAQ retrieval, intent matching, hand-off, log anonymization |
| `ReportModule` | FR-08 | Dashboard queries, export generation, scheduled reports |
| `DocumentModule` | FR-09 | File upload/download, virus scan, retention, archive, delete |
| `AuditModule` | Cross-cutting | Immutable audit log recording, query, export |
| `AdminModule` | Cross-cutting | System configuration, reference data, localization settings |

## 5.2 Module Dependency Map

```
AuthModule ──────────────────────────────────────────────────┐
     │                                                       │
UserModule ◄──────────── AdminModule                         │
     │                       │                               │
     ├───────────────────────┼──────────────────────────┐    │
     │                       │                          │    │
ComplaintModule ───► WorkflowModule ───► SlaModule      │    │
     │                   │                  │           │    │
     │                   ▼                  │           │    │
     │              CaseModule              │           │    │
     │                   │                  │           │    │
     ▼                   ▼                  ▼           │    │
NotificationModule ◄────────────────────────            │    │
     │                                                  │    │
     │             ChatbotModule ──────► ComplaintModule│    │
     │                   │                              │    │
     ▼                   ▼                              ▼    │
AuditModule ◄── (all modules inject AuditService) ◄────┘     │
     │                                                       │
DocumentModule ◄──── CaseModule, ComplaintModule             │
     │                                                       │
ReportModule ◄──── (reads from all data modules) ◄───────────┘
```

## 5.3 Detailed Module Designs

### 5.3.1 AuthModule

**Responsibility**: Authentication, token lifecycle, and SSO integration.

**Components**:

| Component | Type | Purpose |
|---|---|---|
| `AuthController` | Controller | Login, logout, refresh, SSO callback endpoints |
| `AuthService` | Service | Credential validation, token generation, rotation |
| `JwtStrategy` | Strategy | JWT token validation via Passport |
| `OidcStrategy` | Strategy | OIDC/SAML SSO flow (optional, configurable) |
| `AuthGuard` | Guard | Route-level authentication enforcement |
| `RolesGuard` | Guard | Role-based authorization enforcement |
| `PermissionsGuard` | Guard | Fine-grained permission check |

**Auth Flow**:

```
1. POST /api/v1/auth/login
   → Validate credentials against local store or SSO provider
   → Generate JWT access token (15 min TTL)
   → Generate refresh token (HTTP-only secure cookie, 7 day TTL)
   → Log auth event to AuditModule

2. POST /api/v1/auth/refresh
   → Validate refresh token
   → Rotate refresh token (one-time use)
   → Issue new access token
   → Log rotation event

3. POST /api/v1/auth/logout
   → Invalidate refresh token (Redis blocklist)
   → Clear HTTP-only cookie
   → Log logout event
```

**JWT Payload**:

```typescript
interface JwtPayload {
  sub: string;           // User ID (UUID)
  email: string;
  roles: string[];       // e.g., ['CaseOfficer', 'Reviewer']
  permissions: string[]; // e.g., ['complaint:read', 'complaint:assign']
  orgUnit: string;       // Organizational unit ID
  iat: number;
  exp: number;
}
```

### 5.3.2 UserModule

**Responsibility**: User lifecycle, role management, and permission matrix.

**Components**:

| Component | Type | Purpose |
|---|---|---|
| `UserController` | Controller | User CRUD, profile, role assignment |
| `RoleController` | Controller | Role CRUD, permission attachment |
| `UserService` | Service | User business logic, deactivation, team assignment |
| `RoleService` | Service | Role-permission matrix management |
| `UserRepository` | Repository | User data access |
| `RoleRepository` | Repository | Role and permission data access |

**Role-Permission Model**:

```
User ──(many-to-many)──► Role ──(many-to-many)──► Permission

Permissions are resource:action pairs:
  - complaint:create
  - complaint:read
  - complaint:read:own (scoped to own org unit)
  - complaint:assign
  - complaint:escalate
  - workflow:transition
  - report:view
  - report:export
  - audit:read
  - user:manage
  - role:manage
  - config:manage
```

**Baseline Roles** (per SRS FR-01):

| Role | Key Permissions |
|---|---|
| Super Admin | All permissions |
| System Admin | user:manage, role:manage, config:manage |
| Complaints Admin | complaint:*, workflow:*, sla:configure |
| Case Officer | complaint:read:own, complaint:investigate, case:* |
| Reviewer/Approver | complaint:review, complaint:approve, workflow:transition |
| Communications Officer | notification:manage, template:manage |
| Auditor | audit:read, report:view, report:export (read-only) |
| Ombudsperson | complaint:read:all, audit:read, report:* |
| Read-only Observer | complaint:read:all, report:view |
| Public User | complaint:create, complaint:track:own |

### 5.3.3 ComplaintModule

**Responsibility**: Multi-channel complaint intake, registration, and reference number generation.

**Components**:

| Component | Type | Purpose |
|---|---|---|
| `ComplaintController` | Controller | REST endpoints for complaint submission and retrieval |
| `EmailIngestionService` | Service | IMAP/SMTP email parsing into complaint records |
| `SmsIntakeService` | Service | SMS-based complaint registration flow |
| `ComplaintService` | Service | Intake validation, deduplication, reference generation |
| `ComplaintRepository` | Repository | Complaint data access |

**Reference Number Format**:

```
CMS-{YEAR}-{SEQUENTIAL_ID}
Example: CMS-2026-000142

Generated via PostgreSQL sequence to ensure uniqueness under concurrent load.
```

**Intake Channels**:

| Channel | Mechanism | Entry Point |
|---|---|---|
| Web Form | Direct API call from Next.js | `POST /api/v1/complaints` |
| Staff-Assisted | Staff enters on behalf of citizen | `POST /api/v1/complaints` (with `assistedBy` field) |
| Email | IMAP polling + parsing job (BullMQ) | `EmailIngestionProcessor` |
| SMS | Webhook from Ethio Telecom gateway | `POST /api/v1/integrations/sms/inbound` |
| USSD | Webhook from USSD gateway (optional) | `POST /api/v1/integrations/ussd/inbound` |

### 5.3.4 WorkflowModule

**Responsibility**: Complaint lifecycle state machine, transitions, escalations, and appeals.

**State Machine Definition**:

```
                    ┌──────────┐
                    │ Submitted│
                    └────┬─────┘
                         │ triage
                    ┌────▼─────┐
                    │  Triage  │
                    └────┬─────┘
                         │ assign
                    ┌────▼─────┐
                    │ Assigned │◄────────── reassign
                    └────┬─────┘
                         │ investigate
               ┌─────────▼──────────┐
               │  In Investigation  │
               └─────────┬──────────┘
                         │ draft_response
               ┌─────────▼──────────┐
               │   Draft Response   │
               └─────────┬──────────┘
                         │ submit_review
               ┌─────────▼──────────┐
               │  QA/Legal Review   │◄──── return_for_revision
               └─────────┬──────────┘
                         │ approve
               ┌─────────▼──────────┐
               │  Response Issued   │
               └─────────┬──────────┘
                         │ await_feedback
          ┌──────────────▼──────────────┐
          │Awaiting Complainant Feedback│
          └──────────────┬──────────────┘
                         │ close / appeal
                    ┌────▼─────┐     ┌──────────┐
                    │  Closed  │     │  Appeal  │
                    └──────────┘     └──────────┘
```

**Components**:

| Component | Type | Purpose |
|---|---|---|
| `WorkflowController` | Controller | State transition endpoints |
| `WorkflowService` | Service | Transition validation, rule enforcement |
| `WorkflowEngine` | Service | Configurable state machine (XState or custom) |
| `EscalationService` | Service | Time-based escalation rules |
| `TransitionRepository` | Repository | Transition history persistence |

**Transition Enforcement Rules**:
- Every transition requires: actor ID, target state, comment/reason.
- Guard conditions validate: actor has permission for the transition, complaint is in a valid source state, mandatory fields for the target state are populated.
- Every transition produces an immutable audit record.
- SLA timers are reset/started/stopped based on transition type.

### 5.3.5 SlaModule

**Responsibility**: SLA target configuration, real-time timer tracking, breach alerts, and escalation triggers.

**Components**:

| Component | Type | Purpose |
|---|---|---|
| `SlaController` | Controller | SLA configuration CRUD, SLA status queries |
| `SlaService` | Service | SLA assignment, breach calculation, alert dispatch |
| `SlaMonitorProcessor` | BullMQ Worker | Periodic SLA check job (runs every 5 minutes) |
| `SlaRepository` | Repository | SLA config and tracking data access |

**SLA Configuration Model**:

```typescript
interface SlaConfig {
  id: string;
  category: ComplaintCategory;
  priority: Priority;
  stage: WorkflowState;
  targetHours: number;       // target resolution time
  warningThresholdPct: number; // e.g., 80% → alert at 80% of target
  escalationRoleId: string;  // role to notify on breach
  isActive: boolean;
}
```

**SLA Monitor Flow**:
1. BullMQ cron job runs every 5 minutes.
2. Queries all open complaints with active SLA timers.
3. Calculates elapsed time (business hours only, configurable).
4. For each complaint approaching threshold → dispatches warning notification.
5. For each complaint exceeding target → dispatches breach alert and triggers escalation via `WorkflowService`.

### 5.3.6 CaseModule

**Responsibility**: Internal case collaboration tools.

**Key Features**:
- Internal notes (markdown-enabled, staff-only visibility).
- Task lists with assignee and due date.
- @mentions triggering in-app notifications.
- File attachment linking (to DocumentModule).
- Response version history with diff tracking.

### 5.3.7 NotificationModule

**Responsibility**: Outbound multi-channel dispatch (email/SMS templates) **and** per-user in-app inbox notifications.

**Components**:

| Component | Type | Purpose |
|---|---|---|
| `NotificationDeliveriesAdminController` | Controller | Outbound email delivery history, re-send |
| `NotificationTemplatesAdminController` | Controller | Template CRUD |
| `UserNotificationsController` | Controller | Authenticated user's in-app inbox |
| `NotificationsService` | Service | Template rendering, outbound channel routing |
| `InAppNotificationService` | Service | Persist/list/mark-read in-app notifications |
| `NotificationMaintenanceService` | Service | Weekly MFA reminder batch |
| `NotificationDispatchProcessor` | BullMQ Worker | Async outbound dispatch with retry |
| `NotificationMaintenanceProcessor` | BullMQ Worker | Scheduled in-app maintenance jobs |

**In-app notification types** (non-exhaustive): complaint assigned, case task assigned/reassigned, SLA warning/breach, password/email changed, MFA setup reminder, report export ready/failed.

**In-app flow**:
1. Domain services call `InAppNotificationService.notify()` after successful work (assignment, SLA monitor, auth, exports).
2. Rows are stored in `UserNotification` with optional `dedupKey` for idempotency.
3. Staff UI polls `GET /users/me/notifications/unread-count` for the header bell; inbox at `/dashboard/notifications`.
4. Outbound email remains separate under admin **Email deliveries** (`/dashboard/admin/notifications`).

**Template Model**:

```typescript
interface NotificationTemplate {
  id: string;
  code: string;             // e.g., 'COMPLAINT_ACK', 'SLA_BREACH'
  channel: 'email' | 'sms';
  locale: 'en' | 'am';
  subject?: string;         // email only
  bodyTemplate: string;     // Handlebars template with {{variables}}
  isActive: boolean;
}
```

**Dispatch Flow**:
1. A domain event (complaint submitted, state transition, SLA breach) emits a notification request.
2. `NotificationService` resolves the template by code + channel + locale.
3. Renders the template with complaint data.
4. Enqueues a job on BullMQ with priority (SLA breach = high, acknowledgment = normal).
5. `NotificationProcessor` dispatches via the appropriate channel adapter.
6. Delivery status is recorded (sent, failed, delivered if callback available).
7. Failed dispatches are retried with exponential backoff (max 3 retries).

**Sensitive Data Rule (SRS 3.5)**: Notification content must never include full complaint details in SMS. SMS messages contain only the reference number and a link/instruction.

### 5.3.8 ChatbotModule

**Responsibility**: Bilingual FAQ chatbot for citizen guidance.

**Architecture**:

```
Citizen ──► Next.js Chat Widget ──► POST /api/v1/chatbot/message
                                           │
                                    ┌──────▼──────┐
                                    │   Chatbot   │
                                    │   Service   │
                                    │   (NestJS)  │
                                    └──────┬──────┘
                                           │
                                    ┌──────▼──────┐
                                    │Intent Engine│
                                    │ (Rasa /     │
                                    │    custom)  │
                                    └──────┬──────┘
                                           │
                              ┌────────────┼────────────┐
                              │            │            │
                        ┌─────▼─────┐ ┌────▼───┐ ┌──────▼───┐
                        │ FAQ Match │ │Handoff │ │ Fallback │
                        │ (KB query)│ │to Form │ │ Response │
                        └───────────┘ └────────┘ └──────────┘
```

- FAQ content is sourced from a CMS-managed knowledge base (AdminModule).
- Intent matching determines whether to serve an FAQ, guide the user to the complaint form, or hand off to a human channel.
- Conversations are logged with anonymization: no PII stored beyond session scope.
- The chatbot does not collect sensitive personal data (SRS FR-07).

### 5.3.9 ReportModule

**Responsibility**: Analytics dashboards and scheduled report generation.

**Dashboard Queries** (pre-computed materialized views for performance):

| Dashboard | Metrics |
|---|---|
| Volume | Complaints by category, channel, region, period |
| SLA Compliance | On-time %, breach count by category/team/period |
| Resolution | Average resolution time, resolution rate, backlog |
| Repeat Complaints | Complainants with > 1 complaint, repeat categories |
| Channel Utilization | Intake distribution: web, email, SMS, USSD |
| Chatbot Deflection | Questions resolved by chatbot vs. escalated |

**Export**: CSV and Excel (via `exceljs` library), with authorization check and audit log entry.

**Scheduled Reports**: BullMQ cron jobs that generate reports and dispatch to configured email recipients.

### 5.3.10 DocumentModule

**Responsibility**: Secure file lifecycle management.

**Upload Flow**:

```
1. Client uploads file to POST /api/v1/documents/upload
2. Controller validates file type (allowlist), size (configurable max)
3. File is stored in MinIO quarantine bucket
4. BullMQ job dispatches ClamAV scan
5. If clean → move to permanent bucket, create metadata record
6. If infected → delete file, log event, notify uploader
7. Pre-signed URL generated for authorized download (time-limited)
```

**Allowed File Types**: PDF, DOCX, DOC, XLSX, XLS, JPG, JPEG, PNG, GIF, MP4, MP3 (configurable). Executables (EXE, BAT, SH, etc.) are blocked.

**Retention**: Each document record carries a `retentionCategory` linked to policy-driven retention rules. A nightly BullMQ job identifies expired records and marks them for deletion or archival pending admin confirmation.

### 5.3.11 AuditModule

**Responsibility**: Immutable audit trail for all security-sensitive and state-changing operations.

**Audit Record Structure**:

```typescript
interface AuditEntry {
  id: string;               // UUID
  timestamp: Date;          // UTC, set by database
  actorId: string;          // User ID or 'SYSTEM'
  actorRole: string;        // Role at time of action
  action: string;           // e.g., 'COMPLAINT_CREATED', 'STATE_TRANSITION'
  resource: string;         // e.g., 'complaint', 'user', 'role'
  resourceId: string;       // ID of affected resource
  details: object;          // JSON with before/after state, metadata
  ipAddress: string;        // Client IP
  userAgent: string;        // Client user agent
  correlationId: string;    // Request trace ID
}
```

**Immutability Enforcement**:
- The `audit_log` table has no UPDATE or DELETE grants for the application database user.
- Audit writes use a dedicated database role with INSERT-only privileges.
- PostgreSQL triggers prevent row modification after insertion.
- Audit data has its own retention policy (longer than operational data).

<div style="page-break-after: always;"></div>

# 6. Data Design

## 6.1 Entity-Relationship Overview

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│   User   │────►│ UserRole │◄────│     Role     │
└──────────┘     └──────────┘     └───────┬──────┘
     │                                    │
     │                            ┌───────▼──────┐
     │                            │RolePermission│
     │                            └───────┬──────┘
     │                            ┌───────▼──────┐
     │                            │  Permission  │
     │                            └──────────────┘
     │
     │  ┌──────────────┐     ┌────────────────┐
     ├──│  Complaint   │────►│ComplaintHistory│
     │  └──────┬───────┘     └────────────────┘
     │         │
     │         ├─────────────┬─────────────┬─────────────┐
     │         │             │             │             │
     │  ┌──────▼─────┐ ┌─────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
     │  │ Assignment │ │  SlaTracker│ │CaseNote │ │  Attachment │
     │  └────────────┘ └────────────┘ └─────────┘ └─────────────┘
     │
     │  ┌──────────────┐     ┌────────────────────┐
     ├──│ Notification │────►│NotificationTemplate│
     │  └──────────────┘     └────────────────────┘
     │
     │  ┌──────────────┐
     └──│  AuditLog    │  (INSERT-only, immutable)
        └──────────────┘
```

## 6.2 Core Entity Schemas

### 6.2.1 User

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),          -- NULL if SSO-only
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    org_unit_id     UUID REFERENCES org_units(id),
    preferred_locale VARCHAR(5) DEFAULT 'en',  -- 'en' | 'am'
    is_active       BOOLEAN DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2.2 Complaint

```sql
CREATE TABLE complaints (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_no    VARCHAR(20) UNIQUE NOT NULL,  -- CMS-2026-000142
    status          VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    category_id     UUID REFERENCES complaint_categories(id),
    priority        VARCHAR(20) DEFAULT 'NORMAL',  -- LOW, NORMAL, HIGH, URGENT
    channel         VARCHAR(20) NOT NULL,           -- WEB, EMAIL, SMS, USSD, ASSISTED
    locale          VARCHAR(5) NOT NULL DEFAULT 'en',
    
    -- Complainant info (data minimization: only what policy requires)
    complainant_name       VARCHAR(255),
    complainant_email      VARCHAR(255),
    complainant_phone      VARCHAR(20),
    complainant_anonymous  BOOLEAN DEFAULT false,
    
    -- Complaint content
    subject         VARCHAR(500) NOT NULL,
    description     TEXT NOT NULL,
    location        VARCHAR(500),
    
    -- Consent and privacy
    consent_given   BOOLEAN NOT NULL DEFAULT false,
    consent_text_version VARCHAR(20),
    
    -- Assignment
    assigned_to     UUID REFERENCES users(id),
    assigned_unit   UUID REFERENCES org_units(id),
    
    -- Metadata
    submitted_at    TIMESTAMPTZ DEFAULT NOW(),
    closed_at       TIMESTAMPTZ,
    assisted_by     UUID REFERENCES users(id),  -- NULL for self-service
    
    -- Retention
    retention_category VARCHAR(50),
    retention_expires_at TIMESTAMPTZ,
    is_archived     BOOLEAN DEFAULT false,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category_id);
CREATE INDEX idx_complaints_assigned ON complaints(assigned_to);
CREATE INDEX idx_complaints_submitted ON complaints(submitted_at);
CREATE INDEX idx_complaints_reference ON complaints(reference_no);
```

### 6.2.3 Complaint History (Immutable Transitions)

```sql
CREATE TABLE complaint_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id),
    from_status     VARCHAR(50),
    to_status       VARCHAR(50) NOT NULL,
    action          VARCHAR(100) NOT NULL,   -- e.g., 'TRIAGE', 'ASSIGN', 'ESCALATE'
    actor_id        UUID NOT NULL REFERENCES users(id),
    actor_role      VARCHAR(50) NOT NULL,
    comment         TEXT,
    metadata        JSONB,                   -- flexible extra data per transition
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- No UPDATE or DELETE permissions granted on this table
CREATE INDEX idx_history_complaint ON complaint_history(complaint_id);
CREATE INDEX idx_history_created ON complaint_history(created_at);
```

### 6.2.4 SLA Tracker

```sql
CREATE TABLE sla_trackers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id),
    sla_config_id   UUID NOT NULL REFERENCES sla_configs(id),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    target_at       TIMESTAMPTZ NOT NULL,
    warning_at      TIMESTAMPTZ NOT NULL,
    paused_at       TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    breached        BOOLEAN DEFAULT false,
    breached_at     TIMESTAMPTZ,
    elapsed_hours   DECIMAL(10,2),           -- calculated business hours
    status          VARCHAR(20) DEFAULT 'ACTIVE'  -- ACTIVE, PAUSED, COMPLETED, BREACHED
);

CREATE INDEX idx_sla_active ON sla_trackers(status) WHERE status = 'ACTIVE';
```

### 6.2.5 Audit Log

```sql
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp       TIMESTAMPTZ DEFAULT NOW(),
    actor_id        VARCHAR(36) NOT NULL,    -- UUID or 'SYSTEM'
    actor_role      VARCHAR(50),
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50) NOT NULL,
    resource_id     VARCHAR(36),
    details         JSONB,
    ip_address      INET,
    user_agent      TEXT,
    correlation_id  VARCHAR(36)
);

-- Immutability: application DB user has INSERT-only on this table
-- Partitioned by month for performance and retention management
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
```

## 6.3 Row-Level Security (RLS)

PostgreSQL RLS policies enforce data access at the database layer as defense-in-depth beyond application-level RBAC:

```sql
-- Enable RLS on complaints
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Case Officers see only complaints assigned to their org unit
CREATE POLICY case_officer_policy ON complaints
    FOR SELECT
    USING (
        assigned_unit = current_setting('app.current_org_unit')::UUID
        OR current_setting('app.current_role') IN ('SuperAdmin', 'Ombudsperson', 'Auditor')
    );

-- Public Users see only their own complaints
CREATE POLICY public_user_policy ON complaints
    FOR SELECT
    USING (
        complainant_email = current_setting('app.current_user_email')
        OR current_setting('app.current_role') != 'PublicUser'
    );
```

## 6.4 Encryption at Rest

- **Database-level**: PostgreSQL TDE (Transparent Data Encryption) or volume-level encryption on the storage layer.
- **Field-level**: Sensitive PII fields (`complainant_phone`, `complainant_email`) encrypted using `pgcrypto` with application-managed keys stored in Vault.
- **File storage**: MinIO server-side encryption (SSE-S3) with keys managed in Vault.

## 6.5 Data Retention Model

| Data Category | Retention Period | Action at Expiry |
|---|---|---|
| Active complaints | Until closure + policy window | Move to archive |
| Archived complaints | Per MoPD policy (e.g., 5 years) | Anonymize or delete |
| Audit logs | Minimum 7 years | Archive to cold storage |
| Chatbot logs | 90 days | Anonymize |
| Notification logs | 1 year | Delete |
| File attachments | Matches parent complaint | Delete from MinIO |
| Session tokens | 7 days | Auto-expire via Redis TTL |

<div style="page-break-after: always;"></div>

# 7. API Design

## 7.1 API Conventions

All APIs follow the conventions defined in the API Design Patterns skill (REF: `.cursor/skills/api-design/SKILL.md`):

- **Base URL**: `/api/v1/`
- **Resource naming**: Plural, lowercase, kebab-case (e.g., `/api/v1/complaints`, `/api/v1/case-notes`)
- **Versioning**: URL path versioning (`/api/v1/`, `/api/v2/`)
- **Authentication**: Bearer JWT token in `Authorization` header
- **Content type**: `application/json` (UTF-8)
- **Date format**: ISO 8601 with timezone (`2026-03-29T10:30:00Z`)
- **ID format**: UUID v4
- **Pagination**: Cursor-based for large collections (complaints), offset-based for admin lists (users, roles)

## 7.2 Standard Response Envelope

### Success (single resource)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "referenceNo": "CMS-2026-000142",
    "status": "SUBMITTED"
  }
}
```

### Success (collection with pagination)

```json
{
  "data": [...],
  "meta": {
    "total": 1420,
    "page": 1,
    "perPage": 20,
    "totalPages": 71
  },
  "links": {
    "self": "/api/v1/complaints?page=1&perPage=20",
    "next": "/api/v1/complaints?page=2&perPage=20",
    "last": "/api/v1/complaints?page=71&perPage=20"
  }
}
```

### Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "subject",
        "message": "Subject is required",
        "code": "REQUIRED"
      }
    ],
    "correlationId": "req_abc123"
  }
}
```

## 7.3 API Endpoint Inventory

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Authenticate with credentials | Public |
| POST | `/api/v1/auth/refresh` | Refresh access token | Cookie |
| POST | `/api/v1/auth/logout` | Invalidate session | Bearer |
| GET | `/api/v1/auth/sso/callback` | SSO OIDC callback | Public |
| POST | `/api/v1/auth/forgot-password` | Initiate password reset | Public |
| POST | `/api/v1/auth/reset-password` | Complete password reset | Token |

### Users and Roles

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/users` | List users (paginated, filterable) | user:manage |
| GET | `/api/v1/users/:id` | Get user by ID | user:manage |
| POST | `/api/v1/users` | Create user | user:manage |
| PATCH | `/api/v1/users/:id` | Update user | user:manage |
| POST | `/api/v1/users/:id/deactivate` | Deactivate user | user:manage |
| GET | `/api/v1/users/me` | Get current user profile | Authenticated |
| PATCH | `/api/v1/users/me` | Update own profile | Authenticated |
| GET | `/api/v1/roles` | List roles | role:manage |
| POST | `/api/v1/roles` | Create role | role:manage |
| PATCH | `/api/v1/roles/:id` | Update role permissions | role:manage |
| DELETE | `/api/v1/roles/:id` | Delete role (if unassigned) | role:manage |
| GET | `/api/v1/permissions` | List all permissions | role:manage |

### Complaints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/complaints` | Submit new complaint | Public / Authenticated |
| GET | `/api/v1/complaints` | List complaints (filtered, paginated) | complaint:read |
| GET | `/api/v1/complaints/:id` | Get complaint detail | complaint:read |
| GET | `/api/v1/complaints/track/:referenceNo` | Track by reference (public) | Public + OTP |
| PATCH | `/api/v1/complaints/:id` | Update complaint metadata | complaint:update |
| POST | `/api/v1/complaints/:id/assign` | Assign to officer/unit | complaint:assign |
| POST | `/api/v1/complaints/:id/transition` | Transition workflow state | workflow:transition |
| POST | `/api/v1/complaints/:id/escalate` | Escalate complaint | complaint:escalate |
| POST | `/api/v1/complaints/:id/appeal` | File appeal | Public (complainant) |
| GET | `/api/v1/complaints/:id/history` | Get transition history | complaint:read |
| GET | `/api/v1/complaints/:id/sla` | Get SLA status | complaint:read |

### Case Collaboration

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/complaints/:id/notes` | List internal notes | case:read |
| POST | `/api/v1/complaints/:id/notes` | Add internal note | case:write |
| GET | `/api/v1/complaints/:id/tasks` | List case tasks | case:read |
| POST | `/api/v1/complaints/:id/tasks` | Create case task | case:write |
| PATCH | `/api/v1/complaints/:id/tasks/:taskId` | Update task status | case:write |

### Documents

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/documents/upload` | Upload attachment | Authenticated |
| GET | `/api/v1/documents/:id` | Get document metadata | Authenticated |
| GET | `/api/v1/documents/:id/download` | Download (pre-signed URL) | Authenticated |
| DELETE | `/api/v1/documents/:id` | Delete document | document:delete |

### Notifications

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/users/me/notifications` | List in-app inbox for current user | Authenticated |
| GET | `/api/v1/users/me/notifications/unread-count` | Unread in-app count (header bell) | Authenticated |
| PATCH | `/api/v1/users/me/notifications/:id/read` | Mark one in-app notification read | Authenticated |
| POST | `/api/v1/users/me/notifications/read-all` | Mark all in-app notifications read | Authenticated |
| GET | `/api/v1/notifications` | List outbound email delivery history | notification:manage |
| POST | `/api/v1/notifications/:id/resend` | Resend failed outbound email | notification:manage |
| GET | `/api/v1/notification-templates` | List templates | template:manage |
| POST | `/api/v1/notification-templates` | Create template | template:manage |
| PATCH | `/api/v1/notification-templates/:id` | Update template | template:manage |

### Chatbot

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/chatbot/message` | Send message, get response | Public |
| POST | `/api/v1/chatbot/handoff` | Request human handoff | Public |

### Reports

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/reports/dashboard/volume` | Volume dashboard data | report:view |
| GET | `/api/v1/reports/dashboard/sla` | SLA compliance dashboard | report:view |
| GET | `/api/v1/reports/dashboard/resolution` | Resolution metrics | report:view |
| GET | `/api/v1/reports/dashboard/channels` | Channel utilization | report:view |
| POST | `/api/v1/reports/export` | Generate export (async) | report:export |
| GET | `/api/v1/reports/export/:id/download` | Download generated report | report:export |

### Admin / Configuration

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/admin/complaint-categories` | List categories | config:manage |
| POST | `/api/v1/admin/complaint-categories` | Create category | config:manage |
| GET | `/api/v1/admin/sla-configs` | List SLA configs | config:manage |
| POST | `/api/v1/admin/sla-configs` | Create SLA config | config:manage |
| PATCH | `/api/v1/admin/sla-configs/:id` | Update SLA config | config:manage |
| GET | `/api/v1/admin/org-units` | List organizational units | config:manage |
| POST | `/api/v1/admin/org-units` | Create org unit | config:manage |

### Integrations (Webhooks)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/integrations/sms/inbound` | Inbound SMS webhook | API Key |
| POST | `/api/v1/integrations/sms/delivery-status` | SMS delivery callback | API Key |
| POST | `/api/v1/integrations/email/inbound` | Inbound email webhook | API Key |
| POST | `/api/v1/integrations/ussd/inbound` | USSD session webhook | API Key |

### Audit

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/audit-logs` | Query audit logs (filtered) | audit:read |
| GET | `/api/v1/audit-logs/export` | Export audit logs | audit:read |

## 7.4 Rate Limiting

| Tier | Limit | Scope | Endpoints |
|---|---|---|---|
| Public Anonymous | 30 req/min | Per IP | Complaint submission, tracking, chatbot |
| Public Authenticated | 60 req/min | Per user | Public user endpoints |
| Staff | 200 req/min | Per user | Internal staff endpoints |
| Admin | 300 req/min | Per user | Admin and config endpoints |
| Webhooks | 1000 req/min | Per API key | Integration webhook endpoints |

Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) are included on all responses.

<div style="page-break-after: always;"></div>

# 8. Security Design

## 8.1 Security Architecture Overview

Security is designed in alignment with OWASP ASVS v5.0 Level 2 and ISO/IEC 27001:2022 control expectations.

```
┌────────────────────────────────────────────────┐
│                  WAF / CDN                     │
│  DDoS protection, IP reputation, geo-filtering │
├────────────────────────────────────────────────┤
│                TLS Termination                 │
│           TLS 1.2+ (TLS 1.3 preferred)         │
├────────────────────────────────────────────────┤
│              Rate Limiting Layer               │
│           Per-IP and per-user throttling       │
├────────────────────────────────────────────────┤
│            Authentication Layer                │
│     JWT validation, token expiry, rotation     │
├────────────────────────────────────────────────┤
│            Authorization Layer                 │
│     RBAC guards, permission checks, RLS        │
├────────────────────────────────────────────────┤
│           Input Validation Layer               │
│    Schema validation (class-validator / Zod)   │
├────────────────────────────────────────────────┤
│              CSRF Protection                   │
│         Double-submit cookie pattern           │
├────────────────────────────────────────────────┤
│          Application Logic Layer               │
│    Business rules, workflow enforcement        │
├────────────────────────────────────────────────┤
│            Data Access Layer                   │
│    Parameterized queries (Prisma), RLS         │
├────────────────────────────────────────────────┤
│            Audit Logging Layer                 │
│    Immutable audit trail for all state changes │
├────────────────────────────────────────────────┤
│          Encryption at Rest Layer              │
│    PostgreSQL TDE, MinIO SSE, field encryption │
└────────────────────────────────────────────────┘
```

## 8.2 Authentication Controls

| Control | Implementation |
|---|---|
| Password hashing | bcrypt with cost factor 12 |
| Password policy | Min 12 chars, complexity requirements per ASVS |
| Account lockout | 5 failed attempts → 15 min lockout (configurable) |
| MFA | TOTP-based (optional, configurable per role) |
| Session management | JWT access (15 min) + HTTP-only secure refresh cookie (7 days) |
| Token rotation | Refresh tokens are single-use; rotation on every refresh |
| Token revocation | Redis blocklist for invalidated tokens |
| SSO | OIDC/SAML via Passport strategies (when government IdP available) |

## 8.3 Authorization Controls

| Layer | Mechanism |
|---|---|
| API route level | NestJS `@Roles()` and `@Permissions()` decorators with guards |
| Service level | Permission checks in business logic for complex rules |
| Database level | PostgreSQL RLS policies for defense-in-depth |
| Frontend level | Route guards and UI element visibility (not a security boundary) |

## 8.4 Input Validation

- All request bodies validated via `class-validator` DTOs in NestJS.
- File uploads validated for type (allowlist), size, and content (ClamAV scan).
- Query parameters validated and sanitized.
- No raw SQL; Prisma parameterized queries prevent SQL injection.
- HTML output escaped via React's default XSS protection; server-side sanitization with `DOMPurify` for any user-generated rich content.

## 8.5 Security Headers

Applied via NestJS Helmet middleware:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0  (CSP is the modern replacement)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## 8.6 Secrets Management

- All secrets (database credentials, JWT signing keys, API keys, encryption keys) stored in HashiCorp Vault or Docker Secrets.
- No secrets in source code, environment files committed to version control, or container images.
- Secrets rotated on a defined schedule.
- Application retrieves secrets at startup via Vault API or mounted volumes.

## 8.7 ASVS v5.0 Level 2 Compliance Mapping

| ASVS Category | CMS Implementation |
|---|---|
| V1: Architecture | Modular monolith, layered architecture, input validation at boundary |
| V2: Authentication | JWT + refresh rotation, bcrypt, lockout, optional MFA |
| V3: Session Management | Stateless JWT, HTTP-only cookies, Redis blocklist |
| V4: Access Control | RBAC guards, RLS, permission matrix |
| V5: Validation | class-validator DTOs, parameterized queries |
| V6: Cryptography | TLS 1.2+, bcrypt, pgcrypto, Vault key management |
| V7: Error Handling | Structured errors, no stack traces in production |
| V8: Data Protection | Encryption at rest, field-level encryption, data minimization |
| V9: Communications | TLS everywhere, no sensitive data in SMS plaintext |
| V10: Malicious Code | ClamAV file scanning, CSP headers, dependency audit |
| V11: Business Logic | Workflow state machine enforcement, SLA validation |
| V12: Files | Type allowlist, size limits, ClamAV, quarantine bucket |
| V13: API | Rate limiting, schema validation, auth on all endpoints |
| V14: Configuration | Secrets in Vault, no defaults, security headers |

<div style="page-break-after: always;"></div>

# 9. Accessibility Design

## 9.1 WCAG 2.2 AA Conformance Strategy

All public-facing interfaces must conform to WCAG 2.2 Level AA. The design enforces this through:

### Component Library Selection

- **Radix UI primitives** provide WAI-ARIA compliant base components (dialogs, dropdowns, tabs, tooltips).
- **shadcn/ui** built on Radix provides pre-styled accessible components that are customizable.
- Custom components follow WAI-ARIA Authoring Practices.

### Key WCAG 2.2 AA Requirements Addressed

| WCAG Criterion | Implementation |
|---|---|
| 1.1.1 Non-text Content | All images have `alt` text; icons have `aria-label` |
| 1.3.1 Info and Relationships | Semantic HTML (`<main>`, `<nav>`, `<form>`, `<fieldset>`) |
| 1.4.3 Contrast (Minimum) | 4.5:1 for normal text, 3:1 for large text (enforced in design tokens) |
| 1.4.11 Non-text Contrast | 3:1 for UI components and graphical objects |
| 2.1.1 Keyboard | Full keyboard navigation; no keyboard traps |
| 2.4.7 Focus Visible | Custom focus ring (`:focus-visible`) on all interactive elements |
| 2.5.7 Dragging Movements (2.2) | No drag-only interactions; all have click/tap alternatives |
| 2.5.8 Target Size (Minimum) (2.2) | Min 24x24px touch targets; 44x44px for primary actions |
| 3.3.1 Error Identification | Form errors linked to fields via `aria-describedby` |
| 3.3.2 Labels or Instructions | All inputs have visible labels; placeholder is not a label |
| 3.3.7 Redundant Entry (2.2) | Auto-populate previously entered data where possible |
| 3.3.8 Accessible Authentication (Minimum) (2.2) | No cognitive function tests; password manager compatible |
| 4.1.2 Name, Role, Value | ARIA attributes on custom widgets |

### Testing Protocol

1. **Automated**: axe-core integrated into CI pipeline; Lighthouse accessibility audits on every PR.
2. **Manual**: Keyboard-only testing for all user journeys; screen reader testing (NVDA, VoiceOver).
3. **Audit**: Pre-launch accessibility audit by qualified tester (per SOW acceptance criteria).

<div style="page-break-after: always;"></div>

# 10. Localization and Internationalization Design

## 10.1 Architecture

### Frontend (Next.js)

- **Library**: `next-intl` with App Router middleware for locale detection and routing.
- **URL structure**: `/{locale}/...` (e.g., `/en/complaints/new`, `/am/complaints/new`).
- **Message files**: JSON files per locale stored in `messages/en.json` and `messages/am.json`.
- **Fallback**: English is the fallback locale; missing Amharic keys fall back to English with a warning log.

### Backend (NestJS)

- **Library**: `nestjs-i18n` for API error messages and notification templates.
- **Locale detection**: `Accept-Language` header or user's `preferred_locale` from JWT payload.
- **Notification templates**: Stored in the database with separate entries per locale (see NotificationModule).

## 10.2 Amharic-Specific Considerations

| Concern | Solution |
|---|---|
| Font rendering | Noto Sans Ethiopic (Google Fonts) as primary; fallback to system Ethiopic fonts. `@font-face` with `font-display: swap` for performance. |
| Text direction | Amharic is LTR (not RTL). No bidirectional layout changes needed. |
| Text expansion | Amharic text is typically 20-30% longer than English equivalents. UI layouts use flexible containers. |
| Input | Standard keyboard input works for Amharic (OS-level keyboard). No special input method needed in the app. |
| Search | PostgreSQL full-text search configured with Amharic tokenization support. |

## 10.3 Ethiopian Calendar Support

- **Library**: `ethiopian-calendar-date-converter` via [`ethiopian-calendar.ts`](apps/web/src/lib/ethiopian-calendar.ts) (Gregorian ↔ Ethiopian display; UTC storage unchanged).
- **Display**: Dates shown in Ethiopian calendar format where configured by policy (e.g., SLA deadlines, complaint submission dates).
- **Storage**: All dates stored internally as UTC timestamps (Gregorian). Ethiopian calendar is a display-layer concern only.
- **User preference**: Users can toggle between Gregorian and Ethiopian calendar display in their profile settings.

<div style="page-break-after: always;"></div>

# 11. Integration Design

## 11.1 SMS Integration (Ethio Telecom)

```
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌──────────┐
│ CMS API  │────►│ SMS       │────►│ Ethio Telecom│────►│ Citizen  │
│ (NestJS) │     │ Adapter   │     │ SMS API      │     │ (Phone)  │
└──────────┘     └───────────┘     └──────┬───────┘     └──────────┘
                                          │
                                   ┌──────▼──────┐
                                   │ Delivery    │
                                   │ Callback    │────► NotificationModule
                                   └─────────────┘
```

**Adapter Pattern**: A `SmsProvider` interface abstracts the SMS gateway, allowing swappable implementations (Ethio Telecom, mock for testing, fallback provider).

```typescript
interface SmsProvider {
  send(to: string, message: string, options?: SmsOptions): Promise<SmsResult>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
}
```

**OTP Flow**: SMS OTP used for public complaint tracking (reference number + OTP = access to complaint status).

## 11.2 Email Integration

- **Outbound**: Nodemailer with SMTP transport to government mail server.
- **Inbound**: IMAP polling job (BullMQ scheduled every 2 minutes) parses incoming emails, extracts complaint content, and creates complaint records via `ComplaintService`.
- **Parsing**: Structured email parsing with subject-line detection, attachment extraction, and reply-chain handling.

## 11.3 SSO Integration

- **Protocol**: OIDC (preferred) or SAML 2.0.
- **Library**: Passport.js with `passport-openidconnect` or `passport-saml` strategy.
- **Flow**: Authorization code flow with PKCE.
- **Fallback**: Local authentication when SSO is unavailable (configurable per environment).
- **User provisioning**: JIT (Just-In-Time) provisioning from SSO claims with default role assignment.

## 11.4 Chatbot Engine Integration

- **Option A (Recommended for MVP)**: Custom intent-matching engine with keyword-based FAQ retrieval from the knowledge base. Simple, fast to build, no external dependency.
- **Option B (Post-MVP)**: Rasa Open Source for NLU-based intent classification, entity extraction, and dialog management. Supports Amharic with training data.
- **Handoff**: When confidence is below threshold or user requests human help, the chatbot generates a pre-filled complaint form URL and/or connects to staff via notification.

<div style="page-break-after: always;"></div>

# 12. Infrastructure and Deployment Design

## 12.1 Environment Strategy

| Environment | Purpose | Access |
|---|---|---|
| **Development** | Local development and feature work | Developers |
| **Test / QA** | Automated testing and QA verification | QA team, CI/CD |
| **UAT** | User acceptance testing with production-like data | MoPD testers, vendor QA |
| **Production** | Live service | All users |

All environments are infrastructure-as-code provisioned, ensuring consistency.

## 12.2 Deployment Topology

### On-Premises (Primary Option per SOW)

```
┌─────────────────────────────────────────────────┐
│                  Load Balancer                  │
│              (Nginx / HAProxy)                  │
├──────────┬──────────┬───────────────────────────┤
│ Next.js  │ Next.js  │  (2+ instances for HA)    │
│ Node 1   │ Node 2   │                           │
├──────────┴──────────┤                           │
│ NestJS   │ NestJS   │  (2+ instances for HA)    │
│ API 1    │ API 2    │                           │
├──────────┴──────────┤                           │
│ BullMQ   │ BullMQ   │  (2+ worker instances)    │
│ Worker 1 │ Worker 2 │                           │
├─────────────────────┤                           │
│ PostgreSQL (Primary + Standby)                  │
│ Redis (Primary + Sentinel)                      │
│ MinIO (Erasure-coded cluster)                   │
└─────────────────────────────────────────────────┘
```

### Cloud Option (if approved)

Docker containers deployed to a managed Kubernetes cluster or cloud container service with managed PostgreSQL, Redis, and S3.

## 12.3 Docker Compose (Development)

```yaml
services:
  api:
    build: ./apps/api
    ports: ["3001:3001"]
    depends_on: [postgres, redis, minio]
    environment:
      DATABASE_URL: postgresql://cms:password@postgres:5432/cms
      REDIS_URL: redis://redis:6379
      MINIO_ENDPOINT: minio
      MINIO_PORT: "9000"

  web:
    build: ./apps/web
    ports: ["3000:3000"]
    depends_on: [api]
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001/api/v1

  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: cms
      POSTGRES_USER: cms
      POSTGRES_PASSWORD: password

  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    volumes: [miniodata:/data]
    ports: ["9000:9000", "9001:9001"]

  clamav:
    image: clamav/clamav:latest
    volumes: [clamdata:/var/lib/clamav]

volumes:
  pgdata:
  redisdata:
  miniodata:
  clamdata:
```

## 12.4 CI/CD Pipeline

```
┌─────────┐   ┌──────────┐   ┌─────────┐   ┌─────────┐   ┌──────────┐
│  Push   │──►│  Lint +  │──►│  Unit   │──►│  Build  │──►│  Deploy  │
│  to Git │   │  Type    │   │  Tests  │   │  Docker │   │  to Env  │
│         │   │  Check   │   │ + Int.  │   │  Images │   │          │
└─────────┘   └──────────┘   └────┬────┘   └─────────┘   └────┬─────┘
                                  │                           │
                           ┌──────▼──────┐              ┌─────▼──────┐
                           │ Security    │              │ Smoke      │
                           │ Scan (SAST) │              │ Tests (E2E)│
                           └─────────────┘              └────────────┘
```

**Pipeline Stages**:
1. **Lint & Type Check**: ESLint, Prettier, TypeScript compilation (zero errors).
2. **Unit Tests**: Jest tests for all modules (target: 80% coverage).
3. **Integration Tests**: Supertest API tests against test database.
4. **Security Scan**: SAST via Snyk or SonarQube; dependency vulnerability check.
5. **Build**: Docker multi-stage builds for API and Web applications.
6. **Deploy**: Automated deployment to Test/QA; manual approval gate for UAT and Production.
7. **Smoke Tests**: Playwright E2E tests against deployed environment.
8. **Accessibility Check**: axe-core and Lighthouse CI on deployed pages.

<div style="page-break-after: always;"></div>

# 13. Performance and Scalability Design

## 13.1 Performance Targets (from SRS)

| Metric | Target |
|---|---|
| P95 page load (public pages, 3G) | < 3 seconds |
| P95 API response (standard operations) | < 500 ms |
| Monthly uptime | >= 99.5% |

## 13.2 Frontend Performance Strategy

| Technique | Implementation |
|---|---|
| Server-Side Rendering | Next.js RSC for initial page load; streaming SSR |
| Code splitting | Dynamic imports for dashboard charts, admin panels |
| Image optimization | Next.js `<Image>` with WebP/AVIF, lazy loading |
| Font optimization | `next/font` with subset loading for Noto Sans Ethiopic |
| Caching | ISR for static content (FAQ pages); SWR/React Query for dynamic |
| Bundle analysis | `@next/bundle-analyzer` in CI to prevent regressions |
| Service Worker | PWA caching strategy (stale-while-revalidate for assets) |

## 13.3 Backend Performance Strategy

| Technique | Implementation |
|---|---|
| Connection pooling | Prisma connection pool (configurable pool size) |
| Query optimization | Select only needed columns; avoid N+1 via includes/joins |
| Redis caching | Permission lookups (5 min TTL), reference data (15 min TTL) |
| Materialized views | Dashboard aggregations refreshed every 15 minutes |
| Pagination | Cursor-based for large result sets |
| Async processing | All non-blocking work offloaded to BullMQ workers |
| Database indexing | Indexes on all filtered/sorted columns (see Section 6) |

## 13.4 Scalability Path

| Users | Architecture | Key Changes |
|---|---|---|
| 0 - 10K | Modular monolith (single API instance + 2 workers) | Baseline architecture |
| 10K - 50K | Horizontal scaling (3+ API instances, 4+ workers) | Load balancer, Redis Sentinel, PG read replica |
| 50K - 200K | Extract NotificationModule as standalone service | Separate scaling for high-throughput SMS/email |
| 200K+ | Full microservice decomposition | Kubernetes, event bus (NATS/Kafka), distributed tracing |

<div style="page-break-after: always;"></div>

# 14. Observability Design

## 14.1 Three Pillars

### Logging

- **Library**: Pino (structured JSON logs) in NestJS.
- **Aggregation**: Grafana Loki or ELK Stack.
- **Correlation**: Every request gets a `correlationId` (UUID) propagated through all service calls and log entries.
- **Sensitive data**: PII is never logged. Complaint content is redacted in logs.

### Metrics

- **Library**: `prom-client` (Prometheus client for Node.js).
- **Key metrics**:
  - `http_requests_total` (by method, route, status)
  - `http_request_duration_seconds` (histogram)
  - `complaint_created_total` (by channel, category)
  - `sla_breaches_total` (by category, priority)
  - `notification_sent_total` (by channel, status)
  - `bullmq_job_duration_seconds` (by queue)
  - `bullmq_job_failed_total` (by queue)
- **Dashboards**: Grafana dashboards for API health, SLA monitoring, and notification delivery.

### Tracing

- **Library**: OpenTelemetry SDK for Node.js.
- **Backend**: Jaeger or Grafana Tempo.
- **Spans**: Trace from HTTP request through service calls, database queries, and external API calls (SMS, email).

## 14.2 Alerting

| Alert | Condition | Severity | Channel |
|---|---|---|---|
| API error rate | > 5% of requests return 5xx in 5 min | Critical | PagerDuty / SMS |
| API latency | P95 > 2s for 5 minutes | Warning | Email |
| SLA breach spike | > 10 breaches in 1 hour | Warning | Email + Dashboard |
| Database connection pool | > 80% utilization | Warning | Email |
| Redis memory | > 80% capacity | Warning | Email |
| Disk space | > 85% on any volume | Warning | Email |
| Certificate expiry | < 30 days to TLS cert expiry | Warning | Email |
| Failed login spike | > 20 failed logins per IP in 5 min | Critical | Email + Dashboard |

<div style="page-break-after: always;"></div>

# 15. Error Handling Strategy

## 15.1 Error Classification

| Category | HTTP Code | Retry | Logging | User Message |
|---|---|---|---|---|
| Validation error | 400 / 422 | No | Debug | Field-level details |
| Authentication | 401 | No | Info | "Please log in" |
| Authorization | 403 | No | Warn | "Insufficient permissions" |
| Not found | 404 | No | Debug | "Resource not found" |
| Business rule violation | 409 / 422 | No | Info | Human-readable rule explanation |
| Rate limit | 429 | Yes (after Retry-After) | Warn | "Too many requests" |
| External service failure | 502 | Yes (exponential backoff) | Error | "Service temporarily unavailable" |
| Internal error | 500 | Depends | Error | Generic "Something went wrong" |

## 15.2 External Service Resilience

For SMS, email, and SSO integrations:

- **Retry**: Exponential backoff with jitter (1s, 2s, 4s, max 3 retries).
- **Circuit breaker**: If > 50% of requests to an external service fail in a 1-minute window, open the circuit for 30 seconds before half-open retry.
- **Fallback**: Notification dispatch failures are queued for manual retry. SSO failure falls back to local authentication.
- **Dead letter queue**: After all retries exhausted, jobs move to a dead letter queue for manual investigation.

## 15.3 Global Exception Filter (NestJS)

All unhandled exceptions are caught by a global NestJS exception filter that:
1. Maps known exception types to appropriate HTTP status codes.
2. Strips internal details (stack traces, SQL errors) from production responses.
3. Logs the full error with correlation ID for debugging.
4. Returns a structured error response per the API envelope format (Section 7.2).

<div style="page-break-after: always;"></div>

# 16. Testing Strategy

## 16.1 Testing Pyramid

```
        ┌───────────┐
        │   E2E     │  Playwright: critical user journeys
        │   Tests   │  (complaint submission, workflow, tracking)
        ├───────────┤
        │Integration│  Supertest + test DB: API contract verification
        │   Tests   │  (auth flows, RBAC, workflow transitions)
        ├───────────┤
        │   Unit    │  Jest: service logic, validators, utilities
        │   Tests   │  (SLA calculations, template rendering, etc.)
        └───────────┘
```

## 16.2 Coverage Targets

| Layer | Target | Tool |
|---|---|---|
| Unit tests | >= 80% line coverage | Jest + Istanbul |
| Integration tests | All API endpoints exercised | Supertest |
| E2E tests | Critical user journeys covered | Playwright |
| Accessibility | All public pages pass axe-core | axe-core + Lighthouse CI |
| Security | ASVS L2 checklist verified | Manual + automated (SAST) |

## 16.3 Key Test Scenarios

| Scenario | Type | Description |
|---|---|---|
| Complaint submission (web) | E2E | Public user submits complaint in Amharic, receives reference number |
| Complaint submission (SMS) | Integration | Inbound SMS webhook creates complaint record |
| Workflow full lifecycle | Integration | Complaint transitions through all states to closure |
| SLA breach detection | Unit + Integration | SLA monitor correctly identifies and escalates breached complaints |
| RBAC enforcement | Integration | Case Officer cannot access complaints outside their org unit |
| RLS enforcement | Integration | Database rejects unauthorized row access |
| Notification dispatch | Integration | Email and SMS sent on complaint acknowledgment |
| File upload with virus | Integration | Infected file is quarantined and not made available |
| Rate limiting | Integration | Excessive requests return 429 |
| Accessibility | E2E | Complaint form passes WCAG 2.2 AA automated checks |
| Ethiopian calendar display | Unit | Correct Gregorian ↔ Ethiopian date conversion |
| Bilingual template rendering | Unit | Notification templates render correctly in Amharic and English |

<div style="page-break-after: always;"></div>

# 17. Appendices

## A.1 Monorepo Project Structure

```
mopd-cms/
├── apps/
│   ├── api/                          # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── strategies/
│   │   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   │   └── oidc.strategy.ts
│   │   │   │   │   ├── guards/
│   │   │   │   │   │   ├── auth.guard.ts
│   │   │   │   │   │   ├── roles.guard.ts
│   │   │   │   │   │   └── permissions.guard.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── login.dto.ts
│   │   │   │   │       └── refresh.dto.ts
│   │   │   │   ├── user/
│   │   │   │   │   ├── user.module.ts
│   │   │   │   │   ├── user.controller.ts
│   │   │   │   │   ├── user.service.ts
│   │   │   │   │   └── user.repository.ts
│   │   │   │   ├── complaint/
│   │   │   │   │   ├── complaint.module.ts
│   │   │   │   │   ├── complaint.controller.ts
│   │   │   │   │   ├── complaint.service.ts
│   │   │   │   │   ├── complaint.repository.ts
│   │   │   │   │   ├── channels/
│   │   │   │   │   │   ├── email-ingestion.service.ts
│   │   │   │   │   │   └── sms-intake.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── create-complaint.dto.ts
│   │   │   │   │       └── complaint-response.dto.ts
│   │   │   │   ├── workflow/
│   │   │   │   │   ├── workflow.module.ts
│   │   │   │   │   ├── workflow.controller.ts
│   │   │   │   │   ├── workflow.service.ts
│   │   │   │   │   ├── workflow.engine.ts
│   │   │   │   │   └── escalation.service.ts
│   │   │   │   ├── sla/
│   │   │   │   │   ├── sla.module.ts
│   │   │   │   │   ├── sla.controller.ts
│   │   │   │   │   ├── sla.service.ts
│   │   │   │   │   └── sla-monitor.processor.ts
│   │   │   │   ├── case/
│   │   │   │   ├── notification/
│   │   │   │   │   ├── notification.module.ts
│   │   │   │   │   ├── notification.service.ts
│   │   │   │   │   ├── dispatchers/
│   │   │   │   │   │   ├── email.dispatcher.ts
│   │   │   │   │   │   └── sms.dispatcher.ts
│   │   │   │   │   └── notification.processor.ts
│   │   │   │   ├── chatbot/
│   │   │   │   ├── report/
│   │   │   │   ├── document/
│   │   │   │   ├── audit/
│   │   │   │   └── admin/
│   │   │   ├── common/
│   │   │   │   ├── filters/
│   │   │   │   │   └── global-exception.filter.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── audit.interceptor.ts
│   │   │   │   │   └── logging.interceptor.ts
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── roles.decorator.ts
│   │   │   │   │   └── permissions.decorator.ts
│   │   │   │   └── pipes/
│   │   │   │       └── validation.pipe.ts
│   │   │   ├── config/
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── redis.config.ts
│   │   │   │   ├── auth.config.ts
│   │   │   │   └── sms.config.ts
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   ├── Dockerfile
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── web/                          # Next.js Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx                # Root layout (html/body)
│       │   │   ├── [locale]/
│       │   │   │   ├── layout.tsx            # next-intl + providers
│       │   │   │   ├── page.tsx              # Public landing
│       │   │   │   ├── error.tsx / not-found.tsx
│       │   │   │   ├── forbidden/page.tsx    # RBAC denied
│       │   │   │   ├── complaints/
│       │   │   │   │   ├── new/page.tsx      # Submission wizard
│       │   │   │   │   └── track/page.tsx    # Public tracking (Phase 3)
│       │   │   │   ├── dashboard/
│       │   │   │   │   ├── layout.tsx        # Staff shell + auth guard
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── complaints/
│       │   │   │   │   ├── reports/
│       │   │   │   │   └── admin/
│       │   │   │   └── auth/
│       │   │   │       ├── layout.tsx        # Auth shell
│       │   │   │       ├── login/page.tsx
│       │   │   │       ├── forgot-password/page.tsx
│       │   │   │       ├── reset-password/page.tsx
│       │   │   │       └── session-expired/page.tsx
│       │   │   ├── api/                      # Next.js API routes (BFF proxy, if needed)
│       │   │   └── globals.css
│       │   │   # Legacy paths (/login, /submit, /track, /app, /session-expired)
│       │   │   # redirect via next.config.ts — not duplicate route folders
│       │   ├── components/
│       │   │   ├── ui/                       # Primitives (button, input, card)
│       │   │   ├── forms/                    # login-form, reset-password-form
│       │   │   ├── layout/                   # Shells + chrome (no duplicate shell/)
│       │   │   │   ├── locale-switcher.tsx
│       │   │   │   ├── skip-to-content.tsx
│       │   │   │   ├── public/               # public-header, public-nav, public-footer, public-shell
│       │   │   │   ├── app/                  # app-sidebar, app-header, app-footer, app-shell
│       │   │   │   └── auth/                 # auth-shell
│       │   │   ├── auth/                     # app-auth-guard, permission-gate
│       │   │   ├── complaints/submit/        # Public submission wizard
│       │   │   ├── chatbot/
│       │   │   ├── dashboard/
│       │   │   └── providers/
│       │   ├── lib/
│       │   │   ├── api-client.ts             # Typed API client
│       │   │   ├── auth.ts                   # Auth utilities
│       │   │   ├── ethiopian-calendar.ts     # Date conversion
│       │   │   └── validators.ts             # Shared Zod schemas
│       │   ├── hooks/
│       │   │   ├── use-complaints.ts
│       │   │   ├── use-auth.ts
│       │   │   └── use-locale.ts
│       │   ├── i18n/
│       │   │   ├── request.ts
│       │   │   └── routing.ts
│       │   └── styles/
│       │       └── fonts.ts                  # Noto Sans Ethiopic config
│       ├── messages/
│       │   ├── en.json
│       │   └── am.json
│       ├── public/
│       │   ├── manifest.json                 # PWA manifest
│       │   └── icons/
│       ├── tests/
│       │   ├── components/
│       │   └── e2e/
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── Dockerfile
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared TypeScript Types
│       ├── src/
│       │   ├── dto/
│       │   │   ├── complaint.dto.ts
│       │   │   ├── user.dto.ts
│       │   │   └── notification.dto.ts
│       │   ├── enums/
│       │   │   ├── complaint-status.enum.ts
│       │   │   ├── role.enum.ts
│       │   │   ├── channel.enum.ts
│       │   │   └── priority.enum.ts
│       │   ├── interfaces/
│       │   │   ├── api-response.interface.ts
│       │   │   └── pagination.interface.ts
│       │   └── constants/
│       │       ├── permissions.ts
│       │       └── sla-defaults.ts
│       ├── package.json
│       └── tsconfig.json
│
├── infra/
│   ├── docker/
│   │   └── docker-compose.yml
│   ├── terraform/                    # (if cloud)
│   ├── ansible/                      # (if on-prem)
│   └── k8s/                          # (if Kubernetes)
│
├── docs/                             # Project documentation (SDS + future API/runbooks)
│   ├── SDS.md                        # Software Design Specification (same content as this document; repo-local name)
│   ├── API.md                        # Placeholder → REST/OpenAPI reference (to be filled)
│   ├── ADR/                          # Reserved → standalone ADRs (content currently in SDS §2)
│   └── runbooks/                     # Reserved → operational runbooks (deploy, restore, incident)
│
├── .github/ or .gitlab/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── turbo.json
├── package.json                      # Workspace root (Turborepo)
├── tsconfig.base.json
├── .env.example
└── README.md
```

**`docs/` layout:** The monorepo root includes a `docs/` folder as part of the documented structure. **Present:** `docs/SDS.md` — a copy of this SDS using the short filename `SDS.md` for navigation inside the repository (content aligns with `MoPD_CMS_SDS.md` in the `CMS SRS + SDS/` documentation set when both exist in the same workspace). **Stubs (placeholders):** `docs/API.md` (title only until the OpenAPI/exported reference is added), `docs/ADR/` and `docs/runbooks/` (empty folders reserved for extracted ADRs from §2 and operational runbooks).

## A.2 Shared Enum Example

```typescript
// packages/shared/src/enums/complaint-status.enum.ts

export enum ComplaintStatus {
  SUBMITTED = 'SUBMITTED',
  TRIAGE = 'TRIAGE',
  ASSIGNED = 'ASSIGNED',
  IN_INVESTIGATION = 'IN_INVESTIGATION',
  DRAFT_RESPONSE = 'DRAFT_RESPONSE',
  QA_LEGAL_REVIEW = 'QA_LEGAL_REVIEW',
  RESPONSE_ISSUED = 'RESPONSE_ISSUED',
  AWAITING_FEEDBACK = 'AWAITING_FEEDBACK',
  CLOSED = 'CLOSED',
  APPEAL = 'APPEAL',
}

export const COMPLAINT_STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  [ComplaintStatus.SUBMITTED]: [ComplaintStatus.TRIAGE],
  [ComplaintStatus.TRIAGE]: [ComplaintStatus.ASSIGNED],
  [ComplaintStatus.ASSIGNED]: [ComplaintStatus.IN_INVESTIGATION],
  [ComplaintStatus.IN_INVESTIGATION]: [ComplaintStatus.DRAFT_RESPONSE],
  [ComplaintStatus.DRAFT_RESPONSE]: [ComplaintStatus.QA_LEGAL_REVIEW],
  [ComplaintStatus.QA_LEGAL_REVIEW]: [ComplaintStatus.DRAFT_RESPONSE, ComplaintStatus.RESPONSE_ISSUED],
  [ComplaintStatus.RESPONSE_ISSUED]: [ComplaintStatus.AWAITING_FEEDBACK],
  [ComplaintStatus.AWAITING_FEEDBACK]: [ComplaintStatus.CLOSED, ComplaintStatus.APPEAL],
  [ComplaintStatus.CLOSED]: [],
  [ComplaintStatus.APPEAL]: [ComplaintStatus.ASSIGNED],
};
```

## A.3 API Response Interfaces

```typescript
// packages/shared/src/interfaces/api-response.interface.ts

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: PaginationMeta;
  links?: PaginationLinks;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: FieldError[];
    correlationId?: string;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface PaginationLinks {
  self: string;
  next?: string;
  prev?: string;
  first: string;
  last: string;
}

export interface FieldError {
  field: string;
  message: string;
  code: string;
}
```

## A.4 Workflow State Transition Table

| Current State | Allowed Transitions | Required Role(s) | Required Fields |
|---|---|---|---|
| SUBMITTED | TRIAGE | Complaints Admin, Super Admin | - |
| TRIAGE | ASSIGNED | Complaints Admin | assigned_to, assigned_unit, priority |
| ASSIGNED | IN_INVESTIGATION | Case Officer (assigned) | - |
| IN_INVESTIGATION | DRAFT_RESPONSE | Case Officer (assigned) | response_draft |
| DRAFT_RESPONSE | QA_LEGAL_REVIEW | Case Officer (assigned) | - |
| QA_LEGAL_REVIEW | RESPONSE_ISSUED | Reviewer/Approver | approval_comment |
| QA_LEGAL_REVIEW | DRAFT_RESPONSE (return) | Reviewer/Approver | revision_comment |
| RESPONSE_ISSUED | AWAITING_FEEDBACK | System (automatic) | - |
| AWAITING_FEEDBACK | CLOSED | Case Officer, Complaints Admin | closure_reason |
| AWAITING_FEEDBACK | APPEAL | Public User (complainant) | appeal_reason |
| APPEAL | ASSIGNED | Complaints Admin | reassignment details |

## A.5 Notification Template Matrix

| Event Code | Channel | Locale | Trigger |
|---|---|---|---|
| COMPLAINT_ACK | Email, SMS | en, am | Complaint submitted |
| COMPLAINT_ASSIGNED | Email | en, am | Complaint assigned to officer |
| STATUS_UPDATE | Email, SMS | en, am | Workflow state transition |
| SLA_WARNING | Email | en | SLA approaching threshold (internal) |
| SLA_BREACH | Email | en | SLA breached (internal escalation) |
| RESPONSE_ISSUED | Email, SMS | en, am | Response sent to complainant |
| APPEAL_ACK | Email, SMS | en, am | Appeal filed |
| FEEDBACK_REQUEST | Email, SMS | en, am | Requesting complainant feedback |
| CLOSURE_NOTICE | Email, SMS | en, am | Complaint closed |

## A.6 Infrastructure Sizing (Initial Deployment)

| Component | Specification | Quantity |
|---|---|---|
| Next.js Server | 2 vCPU, 4 GB RAM | 2 (HA) |
| NestJS API Server | 2 vCPU, 4 GB RAM | 2 (HA) |
| BullMQ Worker | 2 vCPU, 2 GB RAM | 2 (HA) |
| PostgreSQL | 4 vCPU, 16 GB RAM, 500 GB SSD | 1 Primary + 1 Standby |
| Redis | 2 vCPU, 4 GB RAM | 1 Primary + 2 Sentinel |
| MinIO | 2 vCPU, 4 GB RAM, 1 TB storage | 4-node erasure cluster |
| ClamAV | 2 vCPU, 2 GB RAM | 1 |
| Nginx (LB/WAF) | 2 vCPU, 2 GB RAM | 2 (HA) |
| Monitoring (Prometheus + Grafana + Loki) | 4 vCPU, 8 GB RAM | 1 |

---

*End of Software Design Specification — MoPD Complaint Management System v0.1*

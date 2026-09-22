STATUS: ARCHITECTURAL IMPACT ANALYSIS

DATE: 2026-09-22

PURPOSE:
This document reviews current ANEXSYS implementations against the mandatory multi-company directive and identifies architectural conflicts, gaps, and future refactoring risks.

---

# ANEXSYS Platform
# MASTER_MULTI_COMPANY_ARCHITECTURE_IMPACT_ANALYSIS_V1

## 1. Scope Reviewed

The current review considered the live implementation of:
- tenant model
- branch model
- identity and authentication context
- authorization and effective access
- CRM customer model
- measurement/body-part/unit master data
- operational entity organization context in service orders, production, finance, and fiscal domains

The review is architectural and intentionally avoids database redesign detail.

---

## 2. Executive Summary

The current platform already contains partial alignment with the new directive:
- customer branch ownership has already been removed in the CRM domain
- branch access is already directly user-scoped
- operational entities already preserve branch context

However, the platform still contains major architectural gaps for the new mandatory target:
- Tenant is currently acting as the effective Company boundary
- there is no distinct Company layer below a future Holding layer
- there is no Holding layer at all
- operational entities generally carry Tenant + Branch, not Holding + Company + Branch
- several current master data structures are tenant-scoped rather than global/shared across companies in the same environment
- multi-company login/context currently resolves “company” through tenant selection, not through a dedicated company model and user company scope

This means the current architecture is not yet future-safe for true holding/company/branch consolidation without further refactoring.

---

## 3. Impact Classification Summary

### CRITICAL

1. Tenant is currently functioning as the Company boundary.
2. There is no dedicated Company layer between Tenant/Holding and Branch.
3. Operational entities generally do not carry explicit Company and Holding context.
4. Multi-company login and context switching are currently tenant-based rather than user company-scope based.

### HIGH

5. Body Parts and Measurement Units are tenant-scoped master data, not global/shared master data.
6. Authorization effective access is influenced by Communities for permissions, while the new directive requires communities to remain strictly collaboration/visibility constructs.
7. Branches currently belong directly to Tenant, not to Company.

### MEDIUM

8. Tenant APIs and naming reinforce Tenant as the operational company-like boundary.
9. Consolidated reporting is not yet structurally represented in the live organizational model.
10. Other shared master data families required by the directive are not yet established as explicit global reusable domains.

### LOW

11. CRM customer behavior is now directionally aligned and can serve as a reference model for future master data treatment.

---

## 4. Detailed Impact Analysis

### 4.1 Tenant is acting as the current Company boundary

**Classification:** CRITICAL

**Current evidence**
- `src/modules/tenant/infrastructure/persistence/entities/tenant.entity.ts:6-33`
- `src/modules/identity/infrastructure/persistence/entities/user-identity.entity.ts:7-11`
- `src/modules/identity/application/auth/auth.service.ts:525-539`

**Current behavior**
- users belong to `tenant_id`
- branches belong to `tenant_id`
- login builds “availableCompanies” by loading tenants for matched users
- the current company selector is effectively a tenant selector

**Conflict with directive**

The new directive requires:
- Holding (future)
- Company
- Branch

The current implementation collapses Company into Tenant.

**Architectural impact**

Without separation of Tenant and Company, future support for:
- multiple companies inside the same environment
- holding consolidation
- master data sharing across companies

will require refactoring of identity, authorization context, branch ownership, and operational reporting boundaries.

---

### 4.2 Missing dedicated Company layer

**Classification:** CRITICAL

**Current evidence**
- `src/modules/tenant/infrastructure/persistence/entities/tenant.entity.ts:6-33`
- `src/modules/branch/infrastructure/persistence/entities/branch.entity.ts:8-13`

**Current behavior**

Branches are attached directly to Tenant.

There is no explicit intermediate Company entity or company ownership boundary in the current organizational hierarchy.

**Conflict with directive**

The mandatory architecture requires:

Holding  
-> Company  
-> Branch

**Architectural impact**

This is a foundational structural gap. Future company-specific policies, access, reporting, and consolidation will otherwise remain coupled to Tenant and later require broad refactoring.

---

### 4.3 Operational records do not generally carry explicit Company and Holding context

**Classification:** CRITICAL

**Current evidence**
- `src/modules/service-orders/infrastructure/persistence/entities/service-order.entity.ts:7-14`
- `src/modules/production-orders/infrastructure/persistence/entities/production-order.entity.ts`
- `src/modules/finance/infrastructure/persistence/entities/payment-record.entity.ts`
- `src/modules/fiscal/infrastructure/persistence/entities/fiscal-document.entity.ts`

**Current behavior**

Operational entities commonly carry:
- `tenant_id`
- `branch_id`

but not explicit:
- company context
- holding context

**Conflict with directive**

The new rule requires every operational record to support:
- Holding
- Company
- Branch

**Architectural impact**

Branch reporting is supported directionally, but future company reports and holding reports are not safely represented by the current model. This creates a future refactoring risk for every operational domain.

---

### 4.4 Multi-company access is currently tenant-based in authentication context

**Classification:** CRITICAL

**Current evidence**
- `src/modules/identity/application/auth/auth.service.ts:90-113`
- `src/modules/identity/application/auth/auth.service.ts:323-360`
- `src/modules/identity/application/auth/auth.service.ts:481-539`
- `src/modules/identity/http/auth.controller.ts:129-143`
- `frontend/src/components/providers/session-provider.tsx`

**Current behavior**

The current session context exposes “availableCompanies”, but these are currently built from tenant-linked user identities and selected through `tenantId`.

**Conflict with directive**

The new directive requires direct user-scoped Company Access and Branch Access, not tenant-as-company indirection.

**Architectural impact**

True multi-company support within one environment will require redesign of:
- authentication company selection
- session context
- user organizational scope
- authorization input model

---

### 4.5 Measurement Body Parts and Units are tenant-scoped rather than global/shared

**Classification:** HIGH

**Current evidence**
- `src/modules/crm/application/measurement-catalog/measurement-catalog.service.ts:34-61`
- `src/modules/crm/infrastructure/persistence/entities/measurement-body-part.entity.ts:4-16`
- `src/modules/crm/infrastructure/persistence/entities/measurement-unit.entity.ts:4-16`

**Current behavior**

Body Parts and Measurement Units are currently loaded and managed per tenant.

**Conflict with directive**

The new architectural directive defines them as Master Data that may be shared between Companies in the same environment and must not be branch-owned.

**Architectural impact**

This is not a branch-duplication problem anymore, but it still stops the platform from reaching the new global/shared master-data target.

---

### 4.6 Communities still participate in effective permission assembly

**Classification:** HIGH

**Current evidence**
- `src/modules/authorization/application/authorization/authorization.service.ts:380-416`
- `src/modules/authorization/infrastructure/persistence/entities/user-community.entity.ts:4-14`

**Current behavior**

Communities currently contribute to effective permissions through community-permission links, while branch scope remains directly user-scoped.

**Conflict with directive**

The new directive states that communities must be limited to:
- functional grouping
- collaboration
- visibility groups

This is directionally compatible for access visibility, but not fully aligned if communities remain a first-class permission grant source for organizational behavior.

**Architectural impact**

This is not the same as granting company ownership through communities, but it still means communities are stronger than the new directive intends. Future governance may require narrowing community responsibility.

---

### 4.7 Branches currently belong directly to Tenant

**Classification:** HIGH

**Current evidence**
- `src/modules/branch/infrastructure/persistence/entities/branch.entity.ts:8-13`

**Current behavior**

Each branch belongs directly to a tenant.

**Conflict with directive**

Under the target model, branches must belong to a Company, and Companies must support future Holding grouping.

**Architectural impact**

This creates a core organizational mismatch that will affect:
- branch registration
- access scope
- operational attribution
- reporting hierarchies

---

### 4.8 Tenant terminology currently dominates operational organization language

**Classification:** MEDIUM

**Current evidence**
- `src/modules/tenant/http/tenants.controller.ts:80-118`
- `src/modules/identity/infrastructure/persistence/entities/user-identity.entity.ts:7-11`

**Current behavior**

The current public and internal language centers Tenant as the main organization boundary.

**Conflict with directive**

The new source of truth requires clearer separation between:
- environment/platform scope
- company scope
- branch scope

**Architectural impact**

Naming alone is not the main problem, but it reinforces a structural assumption that Company and Tenant are the same thing.

---

### 4.9 Consolidated reporting is not yet structurally represented

**Classification:** MEDIUM

**Current evidence**
- no explicit Holding entity was identified
- no explicit Company entity was identified
- operational entities generally expose only tenant/branch boundaries

**Current behavior**

The platform can evolve branch-aware reporting, but company-level and holding-level consolidation are not yet first-class architectural capabilities.

**Conflict with directive**

The directive requires consolidated:
- revenue
- cash flow
- DRE
- financial statements
- production indicators

without future migration.

**Architectural impact**

This is a strategic readiness gap rather than an immediate production blocker.

---

### 4.10 Other shared master data domains are not yet formalized as global reusable architecture

**Classification:** MEDIUM

**Current evidence**

The reviewed code confirms progress for Customers and Measurements, but no equivalent global/shared architecture was verified here for:
- Suppliers
- Cities
- States
- Countries
- Postal Codes

**Conflict with directive**

The directive requires these domains to follow the reusable master-data principle.

**Architectural impact**

This is a governance and expansion gap that should be addressed before new modules independently model these references.

---

### 4.11 Customer domain is already directionally aligned

**Classification:** LOW

**Current evidence**
- `src/modules/crm/application/customer/customer.service.ts:46-66`

**Current behavior**

The current CRM customer model already removed branch ownership semantics and preserves customer uniqueness independent from branch.

**Alignment with directive**

This is consistent with:
- Customer as Master Data
- no branch-driven duplication
- branch ownership belonging only to downstream transactions

**Architectural impact**

This area should be preserved as a reference pattern for other master-data domains.

---

## 5. Priority Guidance

### Immediate architectural priorities

1. Separate Company from Tenant in the target organizational model.
2. Introduce future-safe Holding -> Company -> Branch architecture.
3. Redefine user organizational scope around direct Company Access and Branch Access.
4. Ensure operational domains are designed around explicit company-aware context, not only tenant-aware context.

### Near-term harmonization priorities

5. Reclassify shared master data families under the global reusable principle.
6. Review the role of Communities so they remain collaboration/visibility constructs and not implicit organizational control anchors.
7. Preserve the new tenant-wide customer behavior as the baseline master-data example.

---

## 6. Final Conclusion

The current platform is partially aligned with the mandatory directive, but only at the branch and customer level.

The largest architectural conflict is that the current model still effectively treats Tenant as Company.

Because of this, ANEXSYS is not yet fully prepared for:
- true multi-company architecture inside one environment
- future holding structures
- company-level consolidation
- holding-level consolidation
- globally reusable master data shared across companies

The directive can be adopted immediately as the governing source of truth, but significant architectural evolution is still required for full compliance.

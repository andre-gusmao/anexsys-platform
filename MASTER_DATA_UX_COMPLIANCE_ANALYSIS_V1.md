# MASTER_DATA_UX_COMPLIANCE_ANALYSIS_V1

## Scope reviewed

Current frontend routes and workspaces reviewed:

- `/login`
- `/select-branch`
- `/dashboard`
- `/customers`
- `/body-parts`
- `/measurement-units`
- `/admin/tenants`
- `/admin/branches`
- `/admin/access`
- `/service-orders`

Shared UX components reviewed:

- `frontend/src/components/ui/smart-lookup.tsx`
- `frontend/src/components/ui/master-data-duplicate-guard.tsx`

---

## Executive summary

Current ANEXSYS UX direction is **improving but not yet compliant as a platform standard**.

Main positive findings:

- Incremental filtering already exists in several list screens
- `SmartLookup` already supports in-flow quick-create and automatic selection after save
- Early duplicate detection now exists for some natural identifiers and reference entities

Main gaps:

- Smart search is not yet universal across all master-data screens
- Existing record loading is not yet automatic in all duplicate-detection flows
- Dynamic action buttons are not yet consistently driven by record existence
- Operational modules do not yet consume all master data through inline smart lookup

Overall status: **PARTIAL**

---

## Screen-by-screen classification

### 1. `/login`
**Classification:** COMPLIANT

**Findings**
- Not a master-data CRUD screen
- Preserves flow by using only email/password
- Avoids unnecessary context interruption and redirects automatically to the next valid state

**Why**
- This screen does not violate the mandatory UX principle and does not host master-data maintenance

### 2. `/select-branch`
**Classification:** COMPLIANT

**Findings**
- Not a master-data CRUD screen
- Preserves context and resumes the authenticated flow without extra menu navigation
- Automatically reopens company/filial context when possible

**Why**
- This screen supports workflow continuity rather than interrupting it

### 3. `/dashboard`
**Classification:** PARTIAL

**Findings**
- No master-data CRUD or operational lookup behavior yet
- Works as a shell placeholder only

**Why**
- It does not violate the standard, but it also does not yet expose smart retrieval or workflow acceleration

### 4. `/customers`
**Classification:** PARTIAL

**Findings**
- Incremental search exists in the customer directory
- Early duplicate detection exists for CPF/CNPJ
- Duplicate handling still requires explicit **View** or **Edit** choice instead of automatic record loading
- Action area still uses separate create/edit layouts instead of a unified state-adaptive record screen
- Measurement entry supports inline quick-create for body parts and measurement units

**Why**
- Strong progress on Standards 1, 2, and 6
- Still incomplete for Standards 3 and 4

### 5. `/body-parts`
**Classification:** PARTIAL

**Findings**
- Duplicate warning exists before save
- No incremental search input for active records
- No smart existing-record loading when a duplicate is detected
- Save/update actions remain workspace-based rather than record-state adaptive

**Why**
- Standard 2 is partially addressed
- Standards 1, 3, and 4 are not yet fully implemented

### 6. `/measurement-units`
**Classification:** PARTIAL

**Findings**
- Duplicate warning exists before save
- No incremental search input for active records
- No smart existing-record loading when a duplicate is detected
- Action buttons are not record-state adaptive

**Why**
- Same status as Body Parts

### 7. `/admin/tenants`
**Classification:** PARTIAL

**Findings**
- Incremental search exists in the company list
- Early duplicate detection exists for company code
- Duplicate handling still depends on explicit **View/Edit/Cancel**, not automatic form loading
- Dynamic action switching by record-existence state is not yet the primary UX model
- Current workspace does not expose CNPJ, so natural-identifier coverage is incomplete relative to the target standard

**Why**
- Standards 1 and 2 are partially satisfied
- Standards 3 and 4 remain incomplete

### 8. `/admin/branches`
**Classification:** PARTIAL

**Findings**
- Incremental search exists
- `SmartLookup` supports quick-create of parent branch inside the workflow
- No early duplicate detection for branch code before save
- No auto-loading when an existing branch matches the natural identifier

**Why**
- Good reuse and in-flow creation behavior
- Still missing proactive duplicate prevention and smart record loading

### 9. `/admin/access`
**Classification:** PARTIAL

**Findings**
- Incremental filtering exists for users, roles, permissions, and communities
- Early duplicate detection exists for user email
- Duplicate handling still requires manual action rather than automatic load
- `SmartLookup` supports in-flow filial quick-create
- Dynamic action behavior is not yet consistently driven by record-existence state

**Why**
- Good progress on Standards 1, 2, 5, and 6
- Still incomplete for Standards 3 and 4

### 10. `/service-orders`
**Classification:** NON-COMPLIANT

**Findings**
- Screen is currently read-only
- There is no operational smart lookup for customer, services, products, payment methods, or status catalogs
- No inline quick-create behavior exists in the operational flow
- No smart master-data reuse architecture is available yet in this module

**Why**
- Standard 9 requires operational modules to expose the same behavior
- Current Service Orders screen does not yet implement this UX architecture

---

## Shared component assessment

### `frontend/src/components/ui/smart-lookup.tsx`
**Classification:** PARTIAL

**Strengths**
- Incremental filtering while typing
- Supports quick-create inside the current workflow
- Automatically selects the created record after save

**Gaps**
- Does not yet load existing records automatically from natural-identifier duplicate resolution
- Action state is selection-oriented, not full record-state oriented

### `frontend/src/components/ui/master-data-duplicate-guard.tsx`
**Classification:** PARTIAL

**Strengths**
- Standardizes early duplicate messaging
- Supports permission-aware actions like **View**, **Edit**, and **Cancel**
- Reusable across multiple entities

**Gaps**
- Current behavior still depends on user action after detection
- Mandatory target architecture requires automatic record loading as the default behavior

---

## Current platform-level compliance by standard

| Standard | Status | Notes |
|---|---|---|
| Standard 1 — Smart Search | PARTIAL | Present in several screens, not universal |
| Standard 2 — Early Duplicate Detection | PARTIAL | Implemented for some entities only |
| Standard 3 — Smart Record Loading | NON-COMPLIANT | Existing records are not yet auto-loaded by default |
| Standard 4 — Dynamic Action Buttons | NON-COMPLIANT | Save / Update / View state is not yet consistently record-driven |
| Standard 5 — Permission-Aware Behavior | PARTIAL | Present in several screens, but not yet universal |
| Standard 6 — Quick Create Inside Workflows | PARTIAL | Available in SmartLookup flows, not yet across all operational modules |
| Standard 7 — No Workflow Interruption | PARTIAL | Improved in some master-data flows, missing in operational modules |
| Standard 8 — Master Data Reuse | PARTIAL | Pattern exists, but entity coverage is incomplete |
| Standard 9 — Operational Modules | NON-COMPLIANT | Service Orders and other operational modules do not yet implement the standard |
| Standard 10 — UX Principle | PARTIAL | Direction is correct, but implementation is not yet platform-wide |

---

## Remediation plan

### Priority 1 — Mandatory shared architecture

1. Evolve `SmartLookup` into the default framework component for all master-data selection flows
2. Add a standard duplicate-resolution mode that automatically loads an existing record when a natural identifier matches
3. Add built-in dynamic action rendering for **Save / Update / View**
4. Add explicit permission-mode support for editable vs read-only loaded records

### Priority 2 — Complete current master-data screens

1. Customers
   - switch duplicate match to automatic record loading
   - unify create/edit into a single adaptive record screen
2. Companies
   - add CNPJ to the current UX where business scope requires it
   - auto-load matching record on duplicate natural identifier
3. Branches
   - add early duplicate detection for branch code
   - auto-load matched branch before save
4. Users
   - auto-load matched user by email
   - adapt primary action automatically to permission state
5. Body Parts / Measurement Units
   - add incremental search to the maintenance screen
   - auto-focus or load the existing duplicate record when detected

### Priority 3 — Extend to missing master entities

Apply the same UX architecture to:

- Suppliers
- Employees
- Services
- Products
- Payment Methods
- Status Catalogs
- all future user-facing master entities

### Priority 4 — Operational module compliance

1. Service Orders
   - introduce smart lookup for customers and future services/products
   - support quick-create without leaving the workflow
   - auto-return to the original form with selected value populated
2. Future operational modules
   - Production Orders
   - Deliveries
   - Financial Transactions
   - Fiscal Documents

All must consume master data through the same shared UX components.

---

## Mandatory conclusion

ANEXSYS is currently **PARTIAL** against the mandatory UX architecture.

The repository already contains the correct foundational direction through shared smart lookup and duplicate-prevention components, but full compliance requires:

- automatic existing-record loading
- state-adaptive actions
- complete master-entity coverage
- operational workflow adoption across all relevant modules

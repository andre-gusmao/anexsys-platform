# CUSTOMER_AND_CORE_MASTER_DATA_REGRESSION_FIX_REPORT_V1

## Summary

This change addresses functional regressions in customer/core master-data flows, removes technical identifiers from operational admin screens, and restores visible Service Order navigation.

## Corrections

### 1. Customer registration save regression
- **Classification:** BLOCKER
- **Correction:** Customer complement was made optional again in frontend and backend normalization so operational customer registration is not blocked by a non-essential address field.
- **Files:**
  - `frontend/src/components/customers/customer-workspace.tsx`
  - `src/modules/crm/contracts/dto/create-customer.dto.ts`
  - `src/modules/crm/http/customers.controller.ts`
  - `src/modules/crm/application/customer/customer.service.ts`

### 2. Body Part quick-create save regression
- **Classification:** BLOCKER
- **Correction:** Replaced nested quick-create `<form>` usage with button-driven inline submission so body-part quick-create inside measurement flows no longer conflicts with the outer measurement form.
- **Files:**
  - `frontend/src/components/customers/customer-workspace.tsx`

### 3. Measurement registration flow regression
- **Classification:** BLOCKER
- **Correction:** Restored stable inline quick-create behavior used by measurement registration so master-data creation and measurement entry can complete in the same workflow without nested-form submission conflicts.
- **Files:**
  - `frontend/src/components/customers/customer-workspace.tsx`

### 4. Company screen exposing internal IDs
- **Classification:** MAJOR
- **Correction:** Removed visible internal company ID from the operational detail panel and replaced it with business-facing data.
- **Files:**
  - `frontend/src/components/admin/companies-workspace.tsx`

### 5. Branch screen exposing internal IDs
- **Classification:** MAJOR
- **Correction:** Removed visible internal filial ID from the operational detail panel and replaced it with business-facing data.
- **Files:**
  - `frontend/src/components/admin/branches-workspace.tsx`

### 6. User and Access screen exposing internal IDs
- **Classification:** MAJOR
- **Correction:** Removed visible internal user ID from the operational detail panel and replaced it with business-facing information.
- **Files:**
  - `frontend/src/components/admin/access-workspace.tsx`

### 7. Service Order navigation not visible
- **Classification:** MAJOR
- **Correction:** Added visible `Operações -> Service Orders` navigation plus the authenticated route/workspace so the module is discoverable and usable from the sidebar.
- **Files:**
  - `frontend/src/components/app-shell/role-aware-nav.tsx`
  - `frontend/src/components/service-orders/service-orders-workspace.tsx`
  - `frontend/src/app/(authenticated)/service-orders/page.tsx`

### 8. Branch quick-create nested-form hardening
- **Classification:** MINOR
- **Correction:** Updated filial quick-create components used in admin flows to avoid nested form submission conflicts similar to the body-part issue.
- **Files:**
  - `frontend/src/components/admin/branches-workspace.tsx`
  - `frontend/src/components/admin/access-workspace.tsx`

## Validation scope

- frontend request flows reviewed
- API endpoints and controllers reviewed
- DTO validation reviewed
- persistence and repositories reviewed
- route/menu visibility reviewed

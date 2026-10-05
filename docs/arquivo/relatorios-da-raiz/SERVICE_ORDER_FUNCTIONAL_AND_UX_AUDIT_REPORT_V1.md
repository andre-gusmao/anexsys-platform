# SERVICE_ORDER_FUNCTIONAL_AND_UX_AUDIT_REPORT_V1

## 1. Current functional state

### 1.1 Existing screens
- Authenticated route: `/service-orders`
- Frontend page: `frontend/src/app/(authenticated)/service-orders/page.tsx`
- Main workspace: `frontend/src/components/service-orders/service-orders-workspace.tsx`

### 1.2 Existing routes and menu entries
- Sidebar section: `Operações`
- Menu label: `Service Orders`
- Menu visibility requires:
  - `service_orders.read`
- Current navigation path:
  - Login
  - Company / branch context selection
  - Sidebar
  - `Operações`
  - `Service Orders`

### 1.3 Existing backend endpoints
- `GET /service-orders`
- `POST /service-orders`
- `GET /service-orders/:serviceOrderId`
- `PATCH /service-orders/:serviceOrderId`
- `POST /service-orders/:serviceOrderId/items`
- `PATCH /service-orders/:serviceOrderId/items/:itemId`
- `POST /service-orders/:serviceOrderId/approve`
- `POST /service-orders/:serviceOrderId/cancel`
- `POST /service-orders/:serviceOrderId/delivery-date/recalculate`
- `GET /service-orders/:serviceOrderId/timeline`

### 1.4 Existing database objects audited
- `service_orders`
- `service_order_items`

### 1.5 Current implementation status
| Capability | Status | Notes |
|---|---|---|
| Service Order List | IMPLEMENTED | Backend list endpoint exists and frontend grid renders list records. |
| Service Order Create | PARTIALLY IMPLEMENTED | Backend create exists, but no visible frontend create workflow exists. |
| Service Order Update | PARTIALLY IMPLEMENTED | Backend update exists, but no visible frontend edit form or update action exists. |
| Service Order Detail | IMPLEMENTED | Backend detail exists and frontend shows a details panel after row selection. |
| Service Order Workflow | PARTIALLY IMPLEMENTED | Backend workflow actions exist, but current frontend page does not expose them. |

## 2. Current UX state

### 2.1 Current visible UI
The current Service Order page provides:
- search input
- status filter
- grid/table
- details panel

The current page does **not** provide:
- `Nova Service Order`
- `Cadastrar Service Order`
- create form
- edit form
- save button
- update button
- item add/edit actions
- approve button
- cancel button
- recalculate delivery date button

### 2.2 UX pattern compliance
Mandatory ANEXSYS standard:
- Filter
- Grid
- Form

Current Service Order page:
- Filter: **YES**
- Grid: **YES**
- Form: **NO**

Compliance result:
- **NON-COMPLIANT** with the mandatory platform standard

Reason:
- the screen is currently `Filter + Grid + Details`
- it is not `Filter + Grid + Form`
- there is no visible create/update workflow

## 3. Service Order creation flow audit

### 3.1 How a user should create a Service Order today
From the current frontend implementation, the user **cannot create a Service Order through the visible UI**.

### 3.2 Current visible path
Current visible path is only:
- Sidebar
- `Operações`
- `Service Orders`
- search/filter existing records
- click a row
- view details

### 3.3 Missing visible creation path
Missing from the current page:
- create button
- create form
- create action
- item entry flow
- save action
- post-save grid refresh/select workflow

### 3.4 Actual creation capability discovered
Creation is implemented only at backend/API level through:
- `POST /service-orders`

Required payload currently includes:
- `branchId`
- `customerId`
- `items` with at least one item

Optional but supported:
- commercial responsible
- technical measurement responsible
- delivery dates
- payment terms
- delivery type
- operational priority
- surcharge
- discount
- notes

Conclusion:
- Service Order creation is **implemented in backend**
- Service Order creation is **not exposed in current frontend workflow**

## 4. Existing workflows discovered

### 4.1 Current frontend workflow
Current frontend workflow is:
- open module
- search/filter list
- select existing Service Order
- view details

### 4.2 Current backend workflow implemented
Current backend workflow implemented is:
- Customer
- Branch
- Service Order
- Service Order Items
- Delivery Date calculation
- Approve / Cancel
- Production Order generation

### 4.3 Extended implemented process discovered in codebase
Current broader implementation linked to Service Order is:
- Customer
- Service Order
- Production Order
- Production execution / diary / QR
- Quality
- Rework
- Warranty
- Finance
- Pickup / custody related integrations

This means the Service Order is already a real business anchor for downstream modules, even though the current frontend page exposes only list/detail behavior.

## 5. Existing hidden functionality

Hidden or non-exposed functionality already implemented in backend:
- create Service Order
- update Service Order header
- add Service Order item
- update Service Order item
- approve Service Order
- cancel Service Order
- recalculate delivery date
- timeline retrieval
- generate Production Order from Service Order
- finance summary linkage
- partial payments linkage
- quality and warranty downstream linkage

These behaviors are functional at API level but are not surfaced in the current Service Orders workspace.

## 6. Existing permissions affecting visibility

### 6.1 Menu and page visibility
- Menu visibility requires:
  - `service_orders.read`
- Page access requires:
  - `service_orders.read`

### 6.2 Backend write capabilities
Write operations require:
- `service_orders.write`

### 6.3 Branch-scope restrictions
Service Order read/write is also constrained by:
- authenticated tenant context
- effective branch scope of the authenticated user

Implications:
- a user without `service_orders.read` does not see the module
- a user with `service_orders.read` can see the list/detail page
- a user may still be blocked from specific records or creation in another branch
- current lack of create button is **not** caused by missing write permission logic in the page; the page simply does not render a create workflow

## 7. Dependency audit

### 7.1 Mandatory prerequisites for Service Order creation
- Customer: **required**
- Branch: **required**
- At least one item: **required**

### 7.2 Responsibility dependencies
- Commercial Responsible:
  - optional in request
  - defaults to logged actor
- Technical Measurement Responsible:
  - optional in request
  - defaults to commercial responsible if omitted

### 7.3 Not mandatory for creation
- Measurements: **not required**
- Body Parts: **not required**
- Measurement Units: **not required**
- Product master data: **not required**
- Service master data: **not required**

Current item model is free-entry:
- `itemType`
- `description`
- `quantity`
- optional pricing/discount

### 7.4 Additional downstream dependencies
Downstream process dependencies discovered:
- Production Order generation depends on an existing Service Order
- Finance summary / payments depend on an existing Service Order
- Quality / warranty / rejection flows depend on an existing Service Order

## 8. Grid compliance audit

### 8.1 Current grid behavior
Current grid:
- displays existing Service Orders
- supports search
- supports local status filtering
- supports row selection
- loads details on row click

### 8.2 Missing grid-standard behavior
Current grid does **not** support:
- create from same workspace
- update from same workspace
- save and auto-refresh newly created record
- auto-select newly created record after create
- immediate edit-after-create

### 8.3 Compliance conclusion
The Service Order module is **not compliant** with the ANEXSYS mandatory pattern because:
- no visible form exists
- no visible create action exists
- no visible update workflow exists
- no same-screen create → refresh → select → update cycle exists

## 9. Database / backend audit summary

### 9.1 Tables
Confirmed in migration and entities:
- `service_orders`
- `service_order_items`

### 9.2 Entities
Confirmed:
- `ServiceOrderEntity`
- `ServiceOrderItemEntity`

### 9.3 Repositories
Confirmed:
- `ServiceOrderRepository`
- `ServiceOrderItemRepository`

### 9.4 DTOs
Confirmed:
- search DTO
- create DTO
- update DTO
- create item DTO
- update item DTO

### 9.5 Queries
Current repository search supports:
- tenant filter
- branch access filter
- optional branchId
- optional customerId
- optional status
- optional deliveryType
- optional text search

Current frontend uses only:
- search text
- local status filter on already-loaded records

## 10. Root cause of current functional/UX gap

The Service Order module is not absent.

The current issue is:
- backend capability exists
- current frontend route is read/detail oriented
- create/update/workflow actions are not surfaced in the workspace
- the page was built as `filter + grid + details`, not `filter + grid + form`

So the problem is **not missing backend persistence**.

The problem is:
- **missing frontend workflow exposure**
- **missing mandatory form-based UX**
- **missing visible action buttons**

## 11. Missing functionality and missing buttons

### 11.1 Missing visible functionality
- visible create workflow
- visible edit workflow
- visible item maintenance workflow
- visible approve/cancel workflow
- visible delivery date recalculation action

### 11.2 Missing buttons
- `Nova Service Order`
- `Salvar`
- `Atualizar`
- `Adicionar item`
- `Aprovar`
- `Cancelar`
- `Recalcular prazo`

## 12. Next steps required

1. Redesign the Service Order workspace to the mandatory pattern:
   - Filter
   - Grid
   - Form

2. Add visible create action in the workspace.

3. Add Service Order form with:
   - branch
   - customer
   - responsibilities
   - delivery settings
   - notes
   - items

4. Add update workflow in the same workspace.

5. Ensure create behavior:
   - persists record
   - refreshes grid automatically
   - shows new record
   - selects new record
   - allows immediate update

6. Add visible workflow actions only after the base form flow is compliant:
   - approve
   - cancel
   - recalculate delivery date

## 13. Final conclusion

### Functional state
- Backend Service Order capability is **substantially implemented**
- Frontend Service Order capability is **partially exposed**

### UX state
- Current screen is **not compliant** with ANEXSYS platform standard

### Final classification
- Service Order module overall: **PARTIALLY IMPLEMENTED**

Reason:
- list/detail exists
- create/update/workflow exists in backend
- mandatory frontend creation/edit workflow is missing from the current workspace

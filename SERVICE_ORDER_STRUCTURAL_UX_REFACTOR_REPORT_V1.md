# SERVICE_ORDER_STRUCTURAL_UX_REFACTOR_REPORT_V1

## 1. Current structure
- The previous Service Order UX already supported create, save, and update.
- The form still behaved as a mostly single-record experience with only the first item represented directly in the form.
- Company and Branch context were handled in session/topbar controls, but the structural emphasis for Service Orders still needed to be shifted to inherited operational context.

## 2. New structure
- Service Orders now follow the same `Filter → Grid → Form` workspace pattern while the form is structurally divided into:
  - `Order Header`
  - `Items Grid`
- The Order Header shows Company, Branch, Order Number, Status, Opened At, Promised Delivery, Customer, Delivery Type, and operational notes.
- The Items Grid now supports multiple rows inside the same Service Order.
- Context is inherited automatically from the active session:
  - Company is inherited from the active Company context.
  - Branch is inherited from the active Branch context.
- The create flow no longer asks the user to manually choose Company or Branch inside the Service Order form.

## 3. Files changed
- `frontend/src/components/app-shell/admin-shell.tsx`
- `frontend/src/components/providers/session-provider.tsx`
- `frontend/src/components/service-orders/service-orders-workspace.tsx`
- `frontend/src/components/service-orders/service-order-workspace-view-model.ts`
- `frontend/src/app/globals.css`
- `test/unit/service-order-workspace-view-model.spec.ts`
- `SERVICE_ORDER_STRUCTURAL_UX_REFACTOR_REPORT_V1.md`

## 4. Components changed
- `AdminShell`
  - moved Company/Branch context display and switching above the menu area
- `SessionProvider`
  - hardened active-branch resolution for nullable authenticated user payloads
- `ServiceOrdersWorkspace`
  - removed manual Branch selection from the form
  - refactored the form into Header + Items Grid
  - added multi-item editing flow inside the same Service Order
- `service-order-workspace-view-model`
  - centralized item-grid row mapping and item mutation planning

## 5. Context behavior
- Active Company and active Branch are displayed in the shell area above the navigation menu.
- If the authenticated user has access to more than one Company, the Company selector is available in the same header area above the menu.
- Branch selection remains available in the same header area and respects the currently selected Company context.
- Service Orders inherit the active session context automatically and no longer request Company selection in the operational form.

## 6. Company/Branch inheritance behavior
- Create Service Order:
  - Company is inherited from `session.tenantId`
  - Branch is inherited from `session.activeBranchId`
- If there is no active Branch context, the Save action is blocked with a business message directing the user to select the Branch in the header.
- When Company or Branch changes, the Service Order workspace reloads using the new active context automatically.

## 7. Item grid implementation status
- Implemented as a true editable grid structure.
- Supported actions:
  - `Add Item`
  - `Edit Item`
  - `Remove Item`
- Multiple rows are supported in the same Service Order.
- Existing persisted rows are updated through the existing item endpoints.
- New rows are created through the existing add-item endpoint.
- Removed persisted rows are applied through the existing item status update path.

## 8. Validation executed
- `npm run build` ✅
- `npm test` ✅
- `cd frontend && npm run build` ✅
- `cd frontend && npx eslint src/components/service-orders/service-orders-workspace.tsx src/components/service-orders/service-order-workspace-view-model.ts src/components/app-shell/admin-shell.tsx src/components/providers/session-provider.tsx` ✅
- Full `cd frontend && npm run lint` was not rerun here because the repository already has a known unrelated lint failure in `frontend/src/components/admin/companies-workspace.tsx`

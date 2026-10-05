# ANEXSYS_MULTIWORKSPACE_CONCEPT_CORRECTION_REPORT_V1

## Root cause

- The workspace engine allowed tabs to be created before confirming a meaningful business context.
- Browser tab/window actions could fall back to generic labels instead of real screen or record identities.
- The end-user "Duplicate Workspace" action encouraged cloning containers instead of opening concrete work contexts.

## Files changed

- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/app-shell/workspace-manager-store.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/app-shell/workspace-manager.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/app-shell/admin-shell.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/customers/customer-workspace.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/service-orders/service-orders-workspace.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/admin/companies-workspace.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/admin/branches-workspace.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/test/unit/workspace-manager-store.spec.ts`

## UX changes

- Removed the visible "Duplicate Workspace" action from the shell.
- Tabs are now accepted only when they have a real id, pathname, and title.
- Persisted invalid or unnamed tabs are discarded during workspace-store normalization.
- Browser tab/window actions now depend on the current real workspace context instead of generic fallback titles.
- Meaningful tab identities were reinforced in key contexts, including:
  - `Customers`
  - `Customer: <name>`
  - `Service Orders`
  - `OS #<order>`
  - `Empresas`
  - `Empresa: <name>`
  - `Filiais`
  - `Filial: <name>`

## Responsive behavior

- Desktop keeps visible work-context tabs and external open actions.
- Mobile continues without visible tab workspaces and uses preserved context only.
- External browser tab/window actions remain disabled until a real workspace context exists.

## Validation executed

- Targeted frontend ESLint
- Frontend production build
- Repository unit tests
- Secret scan on changed files
- Final automated review/security validation

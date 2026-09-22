# MASTER_DATA_DUPLICATE_PREVENTION_AND_SMART_LOOKUP_V1

## Summary

Implemented ANEXSYS standard duplicate-prevention behavior before save, with immediate blur validation for natural identifiers and reusable warning/resolution UI for master-data flows.

## Implemented standard

### Natural identifier entities

Immediate validation on field blur was added for currently available screens:

- **Customer**: CPF/CNPJ
- **Company**: Code
- **User**: Email

When a duplicate is found before save, the UI now:

- loads duplicate context into a standard reusable duplicate guard
- offers:
  - **View**
  - **Edit**
  - **Cancel**
- blocks save until the conflict is resolved

## Reference entities

Pre-save duplicate warning was added for:

- **Body Parts**
- **Measurement Units**

This behavior now exists in:

- master-data maintenance workspace
- SmartLookup quick-create flow used during customer measurement entry

## Reusable framework component

Created:

- `frontend/src/components/ui/master-data-duplicate-guard.tsx`

This reusable component standardizes:

- duplicate warning / blocking UI
- View / Edit / Cancel action presentation
- shared normalization helpers for:
  - documents
  - email
  - codes
  - body-part normalized codes

## Updated files

- `frontend/src/components/ui/master-data-duplicate-guard.tsx`
- `frontend/src/components/customers/customer-workspace.tsx`
- `frontend/src/components/admin/companies-workspace.tsx`
- `frontend/src/components/admin/access-workspace.tsx`
- `frontend/src/components/measurements/measurement-master-data-workspace.tsx`

## Notes

- Supplier, Employee, Services, and Products reusable support is now available through the shared component, but those specific operational screens are not present in the current frontend scope inspected in this task.
- Company duplicate prevention is currently applied to the company code available in the present workspace model.

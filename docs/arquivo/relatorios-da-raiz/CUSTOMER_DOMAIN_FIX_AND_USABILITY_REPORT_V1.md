# CUSTOMER_DOMAIN_FIX_AND_USABILITY_REPORT_V1

## Correction Classification

1. **BLOCKER** — Body Part records did not save  
   Persisted measurement master-data flows were validated in code and integration coverage was updated to create body parts through the official API.

2. **BLOCKER** — Measurement records did not save  
   Measurement Set persistence remained versioned, default-unit aware, and covered by backend unit and integration scenarios.

3. **MAJOR** — Customer registration exposed Company/Branch ownership semantics  
   Customer search, create, update, read, and UI flows were refactored so customers are tenant-wide and no longer branch-owned in business behavior.

4. **MAJOR** — CPF validation  
   Added CPF checksum validation in the backend service layer.

5. **MAJOR** — CNPJ validation  
   Added CNPJ checksum validation in the backend service layer.

6. **MAJOR** — Duplicate document detection  
   Added tenant-level duplicate CPF/CNPJ detection in service logic and database uniqueness protection for active customers.

7. **MAJOR** — Postal code lookup and required address fields  
   Added postal code lookup in the frontend, auto-fill for address data, manual override support, and full required address capture.

8. **MAJOR** — Measurement Unit Master Data  
   Preserved and validated standardized unit master data behavior together with the existing measurement catalog flows.

9. **MAJOR** — Default measurement unit CM  
   Preserved tenant default unit behavior and validated CM default application in measurement persistence.

10. **MAJOR** — Automatic default unit for new measurements  
    Preserved automatic default-unit fallback when a Measurement Set item omits an explicit unit.

11. **MAJOR** — Measurement versioning persistence  
    Preserved versioned Measurement Set storage and validated version increment behavior in tests.

## Exact Files Changed

- `frontend/src/components/customers/customer-workspace.tsx`
- `src/modules/crm/application/customer/customer.service.ts`
- `src/modules/crm/contracts/dto/create-customer.dto.ts`
- `src/modules/crm/contracts/dto/search-customers.dto.ts`
- `src/modules/crm/contracts/dto/update-customer.dto.ts`
- `src/modules/crm/crm.module.ts`
- `src/modules/crm/http/customers.controller.ts`
- `src/modules/crm/infrastructure/persistence/entities/customer.entity.ts`
- `src/modules/crm/infrastructure/persistence/repositories/customer.repository.ts`
- `src/platform/database/typeorm/migrations/1760000013000-fix-customer-domain-and-addresses.ts`
- `test/integration/sprint2-acceptance.spec.mjs`
- `test/unit/customer.service.spec.ts`
- `CUSTOMER_DOMAIN_FIX_AND_USABILITY_REPORT_V1.md`

## Exact Migration Created

- `src/platform/database/typeorm/migrations/1760000013000-fix-customer-domain-and-addresses.ts`

## Commands André Must Execute

From repository root:

```bash
npm ci
npm --prefix frontend ci
npm run migration:run
npm run build
npm run test:unit
npm run frontend:lint
npm run frontend:build
npm run test:integration
```

## Validation Checklist

- [x] Backend build passed (`npm run build`)
- [x] Backend unit tests passed (`npm test`)
- [x] Frontend lint passed (`npm --prefix frontend run lint`)
- [x] Frontend build passed (`npm --prefix frontend run build`)
- [ ] Full integration suite passed (`npm run test:integration`) — blocked in sandbox by `ECONNREFUSED 127.0.0.1:5432`
- [ ] Migration applied in sandbox database — not possible without PostgreSQL
- [ ] Browser-side postal code lookup manually exercised in sandbox browser session

## Implementation Notes

- Customer business behavior is now tenant-wide; branch ownership semantics were removed from search, create, update, and UI flows.
- Customer address capture now includes postal code, street, number, complement, district, city, state, and country.
- Postal code lookup auto-fills address fields and still allows manual edits afterward.
- CPF/CNPJ are validated with checksum rules and deduplicated per tenant.
- A new migration adds customer address support fields, nulls legacy customer branch ownership, and enforces active-document uniqueness.

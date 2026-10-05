# TERMINOLOGY_STANDARDIZATION_V1

## Objective

Standardize the organizational-entity terminology used in visible ANEXSYS application text.

## Canonical terminology

- **Business Term:** Filial
- **Technical Term:** Branch
- **Database Entity:** `branches`

## Forbidden user-facing terms for the organizational entity

Do not use the following terms when referring to the entity represented technically by `Branch` and physically by the `branches` table:

- Ramo
- Store
- Unit

## Reserved use of “Ramo”

`Ramo` must be reserved for business-segment meaning only, such as:

- Alfaiataria
- Consultoria
- Contabilidade

## Applied updates

The current standardization pass updated visible frontend references so the organizational entity is shown to the user as **Filial**, including:

- active-context labels in the administrative shell
- branch selection screen titles, subtitles, and card labels
- login guidance text
- dashboard summary text
- branch fallback labels and access-scope error messaging

## Files updated

- `frontend/src/components/app-shell/admin-shell.tsx`
- `frontend/src/app/select-branch/page.tsx`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/(authenticated)/dashboard/page.tsx`
- `frontend/src/components/providers/session-provider.tsx`

## Notes

- Technical identifiers such as `Branch`, `branchId`, route names, API paths, permission names, and the `branches` entity/table remain unchanged.
- The goal of this change is user-facing terminology consistency, not architectural or persistence refactoring.

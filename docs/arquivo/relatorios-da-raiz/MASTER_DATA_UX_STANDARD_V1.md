# MASTER_DATA_UX_STANDARD_V1

## Status

**MANDATORY PLATFORM STANDARD**

## Applies to

- Existing modules
- Future modules
- All new CRUD implementations
- All operational workflows

---

## Core Principle

ANEXSYS must never interrupt the user's workflow.

The platform must help users find, reuse, update and create records with minimum navigation, minimum typing, and preserved context.

Master Data management must always be proactive.

---

## Standard 1 — Smart Search

Every Master Data entity must support incremental search.

Covered entities include:

- Customers
- Suppliers
- Companies
- Branches
- Employees
- Services
- Products
- Body Parts
- Measurement Units

Expected behavior:

- User starts typing and suggestions appear immediately
- No dedicated **Save** or **Search** button may be required to retrieve likely matches
- Search must be usable both in dedicated master-data screens and inside operational workflows

---

## Standard 2 — Early Duplicate Detection

Duplicate detection must happen **before Save**.

The platform must never wait until the user clicks Save to discover an obvious duplicate.

Examples of natural identifiers:

- Customer: CPF
- Company: CNPJ
- User: Email
- Supplier: CNPJ
- Employee: CPF

Expected behavior:

- Validation occurs when the user leaves the field
- Duplicate state must be visible immediately
- Save must not remain the first discovery point for obvious duplication

---

## Standard 3 — Smart Record Loading

If the record already exists, the system must automatically load the existing record.

Expected behavior:

- Form fields are populated from the matched record
- The user does not need to retype existing information
- The record becomes the current working context automatically

---

## Standard 4 — Dynamic Action Buttons

The primary action area must adapt automatically to the current record state.

Expected behavior:

- If record does **not** exist: display **[ Save ]**
- If record exists and user has edit permission: display **[ Update ]**
- If record exists and user has view-only permission: display **[ View ]**

The screen must not require the user to infer which action is allowed.

---

## Standard 5 — Permission-Aware Behavior

Existing record:

- If the user has edit permission: load and allow update
- If the user does not have edit permission: load read-only

Expected behavior:

- Never expose unauthorized actions
- Never show create/update affordances that the current user cannot execute
- Use permissions to adapt behavior, not just to reject actions later

---

## Standard 6 — Quick Create Inside Workflows

When searching inside an operational process, the platform must support in-flow quick create.

Example:

- Workflow: Service Order
- Field: Customer
- No customer found
- System displays: **+ Create Customer**

Expected behavior:

- If permitted, quick-create opens inside the same workflow
- After save, the workflow returns automatically to the original context
- The selected value is populated automatically
- The user must never lose context

---

## Standard 7 — No Workflow Interruption

The platform must never force the user to:

- Leave the current screen
- Navigate menus to maintain master data
- Create required master data elsewhere
- Return manually to resume the original task

Quick-create and smart loading are mandatory anti-interruption mechanisms.

---

## Standard 8 — Master Data Reuse

The same UX rules apply to:

- Customers
- Suppliers
- Companies
- Branches
- Employees
- Users
- Services
- Products
- Body Parts
- Measurement Units
- Payment Methods
- Status Catalogs
- Future master entities

No master entity is exempt from this architecture once it becomes user-facing.

---

## Standard 9 — Operational Modules

The same behavior must be available in:

- Service Requests
- Service Orders
- Production Orders
- Deliveries
- Financial Transactions
- Fiscal Documents

Operational modules must consume master data through the same smart, context-preserving mechanisms.

---

## Standard 10 — ANEXSYS User Experience Principle

The platform must always favor:

- Data reuse
- Early validation
- Fast retrieval
- Context preservation
- Minimum clicks
- Minimum typing

Users must feel they are assisted by the system rather than fighting against it.

---

## Mandatory Implementation Directive

All current and future ANEXSYS screens that create, search, select, or maintain master data must converge to this architecture.

Implementation decisions, UI components, and workflow design must be evaluated against these standards before release approval.

# ANEXSYS_USER_FEEDBACK_AND_VALIDATION_STANDARD_V1

## Status

**MANDATORY PLATFORM STANDARD**

## Applies to

- All Master Data
- All Operational Processes
- All Existing Modules
- All Future Modules

---

## Core Principle

The user must never guess what happened.

Every action must provide clear feedback.

Every validation must explain:

1. What happened
2. Why it happened
3. What the user should do next

Technical messages are forbidden in user-facing screens.

---

## Problem Identified

Examples such as:

- `property street should not exist`
- `property city should not exist`
- empty failure states
- silent save failures

are not acceptable for ANEXSYS.

Users are not developers.

The platform must translate validation and process outcomes into business language.

---

## Standard 1 — Success Feedback

Every successful operation must display clear confirmation.

Examples:

- ✅ Customer created successfully.
- ✅ Company updated successfully.
- ✅ Measurement saved successfully.

Expected behavior:

- Success messages must be immediate
- Success messages must identify the affected record or action whenever useful
- Success messages must confirm the operation completed correctly

---

## Standard 2 — Validation Feedback

Validation must occur before Save whenever possible.

Examples:

### Invalid CPF

Display:

- ❌ Invalid CPF.
- Please check the verification digits.

### Missing required field

Display:

- ❌ Customer name is required.

### Invalid e-mail

Display:

- ❌ Invalid e-mail format.

Expected behavior:

- Validation must use business language
- Validation must identify the exact field or rule
- Validation must tell the user what to correct
- The user must not need to inspect network errors or technical logs

---

## Standard 3 — Duplicate Detection

Duplicate detection must happen **before Save**.

The user must never complete the entire form only to discover a duplicate at the end.

### Customer example

User enters CPF.

System automatically searches.

If customer exists, display:

- ✅ Customer already registered.
- customer name
- available actions according to permission

Examples:

- `[View]`
- `[Edit]`
- `[Update]`

### Company example

User enters CNPJ.

If company exists, display:

- ✅ Company already exists.
- company name
- available actions according to permission

Expected behavior:

- Duplicate status must be visible immediately
- Existing records must become actionable immediately
- Duplicate feedback must be informative, not punitive

---

## Standard 4 — Smart Form Behavior

Forms must adapt automatically to the current state of the record.

Expected behavior:

- If record does not exist: allow normal creation
- If record exists and user can edit: load the record and switch the primary action to update
- If record exists and user can only view: load the record in read-only mode
- If record exists and user has no access: explain the restriction clearly without exposing unauthorized actions

The form must help the user continue from the current context instead of restarting the workflow.

---

## Standard 5 — User Guidance After Validation

Every validation or process message must guide the next action.

Messages must always answer:

- what happened
- why it happened
- what the user should do next

Examples:

- ❌ Invalid CPF. Please check the verification digits.
- ❌ Customer name is required. Fill in the customer name to continue.
- ❌ Company already exists. Open the existing company to review or update it.

Short messages are acceptable only when they are still complete and unambiguous.

---

## Standard 6 — Permission-Aware Feedback

Feedback must respect the current user's permission level.

Expected behavior:

- If the user can edit, offer edit/update actions
- If the user can only view, offer view-only actions
- If the user cannot act, explain that the record exists but cannot be modified in the current context

The platform must never present actions the user cannot execute.

---

## Standard 7 — No Technical Messages

Technical validation details are forbidden in the operational interface.

Forbidden examples:

- raw DTO validation errors
- raw property-level framework messages
- stack traces
- internal field names when they are not business-facing

Required behavior:

- translate technical failures into business-friendly language
- preserve technical details only in logs, diagnostics, and support channels
- keep user messages understandable without developer assistance

---

## Standard 8 — Operational Workflow Continuity

Feedback and validation must preserve the user's workflow.

The platform must never force the user to:

- guess whether the action worked
- leave the screen to understand the problem
- repeat the same full form unnecessarily
- lose the current context after validation

Validation and feedback must keep the user oriented and productive.

---

## Standard 9 — Master Data and Operational Consistency

The same feedback and validation rules apply to:

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
- Service Orders
- Production Orders
- Deliveries
- Financial Transactions
- Fiscal Documents
- Future modules

No module is exempt from this standard once it becomes user-facing.

---

## Standard 10 — ANEXSYS User Experience Principle

The platform must always favor:

- clarity
- predictability
- early validation
- understandable feedback
- context preservation
- minimum rework

Users must always understand whether the action succeeded, failed, or requires correction.

---

## Mandatory Implementation Directive

All current and future ANEXSYS screens must implement feedback and validation according to this standard.

Before release approval, every user-facing action must be reviewed to ensure:

- success states are explicit
- validation states are understandable
- duplicate states are proactive
- technical messages are hidden from end users
- next steps are always clear

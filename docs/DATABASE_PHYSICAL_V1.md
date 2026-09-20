# ANEXSYS Platform
# DATABASE_PHYSICAL_V1

## Document Purpose

This document transforms the approved ANEXSYS logical data model into a complete PostgreSQL-oriented physical data model using the frozen baseline documents as source of truth and the approved downstream modeling documents as design inputs:
- `/docs/frozen/SRS_MASTER_V1.3.md`
- `/docs/frozen/ARQUITETURA_V1.md`
- `/docs/frozen/DATABASE_GUIDELINES_V1.md`
- `/docs/DATABASE_CONCEPTUAL_V1.md`
- `/docs/DATABASE_LOGICAL_V1.md`

This document defines:
- physical tables
- primary keys
- foreign keys
- physical constraints
- audit fields
- soft delete strategy
- multi-tenant strategy
- multi-branch strategy
- workflow tables
- event tables
- audit tables
- financial tables
- production tables
- quality tables
- operational resource tables
- physical relationship rules

This document does not define:
- SQL scripts
- PostgreSQL DDL scripts
- index definitions
- migration scripts
- APIs
- infrastructure topology

---

## 1. Executive Summary

The ANEXSYS physical model must preserve the approved business split between commercial truth and operational truth:
- Service Order = commercial and financial source of truth
- Production Order = operational execution source of truth
- Physical Production Bag = support-only physical context

The PostgreSQL physical model must preserve these approved operating rules:
- 1 Customer -> many Service Orders
- 1 Service Order -> many Service Order Items
- 1 Service Order -> exactly 1 base Production Order
- 1 Production Order -> many Production Order Versions over time when corrective lineage is required
- Production Order QR ownership remains exclusive
- Production Order execution remains the source of operational status and responsibility
- the physical bag never becomes an independent numbered, workflow-owned, or QR-owned business authority

The physical model therefore emphasizes:
- tenant-safe data isolation
- branch-scoped business operations
- normalized master and transactional tables
- explicit foreign-key ownership
- auditable status and responsibility changes
- immutable event and audit records where traceability matters
- soft-delete behavior only where business recovery is appropriate

---

## 2. PostgreSQL Physical Modeling Standards

### 2.1 Naming standard
- physical table names use lowercase snake_case and plural form
- primary-key columns use `id`
- foreign-key columns use `<referenced_entity>_id`
- timestamp fields use `*_at`
- actor fields use `*_by`

### 2.2 Primary key standard
- all primary business and policy tables use `uuid` primary keys
- support and bridge tables also use `uuid` primary keys unless explicitly identified as append-only event tables with their own `uuid`

### 2.3 Standard audit columns

Standard mutable business tables should include:
- `id uuid`
- `created_at timestamptz`
- `created_by uuid`
- `updated_at timestamptz`
- `updated_by uuid`
- `row_version bigint`

Soft-deletable business tables should additionally include:
- `deleted_at timestamptz`
- `deleted_by uuid`
- `is_deleted boolean`

### 2.4 Standard tenant columns
- `tenant_id uuid not null` is mandatory for all tenant-scoped tables except `tenants`
- every tenant-scoped foreign-key path must remain tenant-consistent

### 2.5 Standard branch columns
- `branch_id uuid not null` is mandatory for branch-scoped transactional tables
- `branch_id uuid null` is allowed for tenant-wide master data that may optionally be branch-scoped

### 2.6 Standard PostgreSQL data types
- identifiers: `uuid`
- status and short codes: `varchar`
- long narrative text: `text`
- date-only values: `date`
- timestamps: `timestamptz`
- monetary and quantity values: `numeric`
- boolean flags: `boolean`
- structured supplemental context: `jsonb`

### 2.7 Soft delete rule
- master and transactional tables may use soft delete where business recovery is useful
- immutable audit and event tables must not use soft delete
- soft-deleted records remain excluded from active business views but retained for auditability

---

## 3. Table Catalog

| Domain | Physical Table | Primary Key | Purpose |
|---|---|---|---|
| Tenant Governance | `tenants` | `id` | top-level business isolation boundary |
| Tenant Governance | `branches` | `id` | branch-local operating unit |
| Customer and CRM | `customers` | `id` | customer master identity |
| Customer and CRM | `customer_contacts` | `id` | customer contact points |
| Customer and CRM | `customer_interactions` | `id` | customer communication and service history |
| Customer and CRM | `measurement_records` | `id` | versioned measurement history |
| Service Order | `service_orders` | `id` | commercial and financial source-of-truth record |
| Service Order | `service_order_items` | `id` | item-level scope under service order |
| Production | `production_orders` | `id` | operational execution anchor |
| Production | `production_order_item_links` | `id` | item-reference set for the one order-scoped production order |
| Production | `production_order_versions` | `id` | corrective lineage records |
| Production | `production_order_operational_assignments` | `id` | responsibility and assignment history |
| Production / Events | `production_execution_events` | `id` | operational execution events and diary-linked actions |
| Operational Resource | `operational_resources` | `id` | execution-capacity identity |
| Operational Resource | `operational_resource_branch_scopes` | `id` | branch allocation scope for resources |
| Quality | `quality_records` | `id` | inspection results and release decisions |
| Quality | `customer_rejections` | `id` | post-delivery rejection facts |
| Quality | `rework_cases` | `id` | internal corrective execution cases |
| Quality | `warranty_adjustments` | `id` | non-execution warranty obligations |
| Quality | `warranty_executions` | `id` | execution-related warranty cases |
| Finance and Fiscal | `payment_records` | `id` | payment transaction and settlement records |
| Finance and Fiscal | `partial_payments` | `id` | partial allocation records |
| Finance and Fiscal | `financial_exceptions` | `id` | exceptional financial correction cases |
| Finance and Fiscal | `fiscal_documents` | `id` | fiscal issuance lifecycle |
| Delivery and Pickup | `pickup_authorizations` | `id` | release authorization root |
| Delivery and Pickup | `pickup_tokens` | `id` | tokenized release artifacts |
| Delivery and Pickup | `pickup_qr_codes` | `id` | QR-based release artifacts |
| Delivery and Pickup | `temporary_pickup_codes` | `id` | short-lived release artifacts |
| Delivery and Pickup | `storage_locations` | `id` | shared location catalog |
| Delivery and Pickup | `storage_location_assignments` | `id` | current and historical retrieval placement |
| Delivery and Pickup | `physical_bag_support_contexts` | `id` | optional support-only bag context |
| Workflow and SLA | `workflow_definitions` | `id` | lifecycle policy root |
| Workflow and SLA | `status_definitions` | `id` | status catalog under workflow |
| Workflow and SLA | `sla_rules` | `id` | timing and violation policy rules |
| Workflow and SLA | `sla_rule_triggers` | `id` | multi-status and event trigger mappings for SLA rules |
| QR and Operational Tracking | `qr_codes` | `id` | production-order operational QR authority |
| QR and Operational Tracking | `qr_events` | `id` | QR scan trace |
| Audit and Traceability | `custody_events` | `id` | chain-of-custody event log |
| Audit and Traceability | `audit_events` | `id` | immutable cross-domain audit log |
| Audit and Traceability | `cctv_references` | `id` | custody/pickup surveillance evidence references |
| Audit and Traceability | `camera_snapshots` | `id` | custody/pickup captured image evidence |
| Communication and Approval | `communication_events` | `id` | message and notification trace |
| Communication and Approval | `digital_approvals` | `id` | auditable approval decisions |

---

## 4. Multi-Tenant Model

### 4.1 Tenant isolation rule
- `tenants` is the top-level isolation table
- every tenant-scoped table must carry `tenant_id`
- no transactional row may reference a foreign row from another tenant

### 4.2 Tenant-owned tables
The following tables are tenant-scoped:
- `branches`
- `customers`
- `customer_contacts`
- `customer_interactions`
- `measurement_records`
- `service_orders`
- `service_order_items`
- `production_orders`
- `production_order_item_links`
- `production_order_versions`
- `production_order_operational_assignments`
- `production_execution_events`
- `operational_resources`
- `operational_resource_branch_scopes`
- `quality_records`
- `customer_rejections`
- `rework_cases`
- `warranty_adjustments`
- `warranty_executions`
- `payment_records`
- `partial_payments`
- `financial_exceptions`
- `fiscal_documents`
- `pickup_authorizations`
- `pickup_tokens`
- `pickup_qr_codes`
- `temporary_pickup_codes`
- `storage_locations`
- `storage_location_assignments`
- `physical_bag_support_contexts`
- `workflow_definitions`
- `status_definitions`
- `sla_rules`
- `sla_rule_triggers`
- `qr_codes`
- `qr_events`
- `custody_events`
- `audit_events`
- `cctv_references`
- `camera_snapshots`
- `communication_events`
- `digital_approvals`

### 4.3 Tenant consistency rule
All foreign-key chains must preserve tenant consistency, especially for:
- Customer -> Service Order -> Production Order lineage
- Service Order -> Financial records
- Production Order -> QR / Quality / Rework / Warranty Execution
- Service Order -> Pickup / Storage / Custody records

---

## 5. Multi-Branch Model

### 5.1 Branch ownership rule
- each branch belongs to exactly one tenant
- each service order belongs to exactly one owning branch
- each production order belongs to exactly one owning branch

### 5.2 Optional branch scoping
- `customers.branch_id` may be null to represent tenant-wide customers
- `operational_resources` may carry `home_branch_id`
- `operational_resource_branch_scopes` allows additional branch allocations over time
- tenant-wide customers do not create branchless transactions; each Service Order and its downstream operational, quality, financial, and pickup lineage still carries the owning `branch_id`

### 5.3 Branch-scoped transactional tables
The following tables carry `branch_id not null` either as direct branch ownership or as explicit branch-scoped integrity reinforcement, while some other support/link tables may derive branch scope only through parent foreign-key lineage:
- `service_orders`
- `service_order_items`
- `production_orders`
- `production_order_versions`
- `production_order_operational_assignments`
- `production_execution_events`
- `quality_records`
- `customer_rejections`
- `rework_cases`
- `warranty_adjustments`
- `warranty_executions`
- `payment_records`
- `partial_payments`
- `financial_exceptions`
- `fiscal_documents`
- `pickup_authorizations`
- `storage_locations`
- `storage_location_assignments`
- `physical_bag_support_contexts`
- `qr_codes`
- `qr_events`
- `custody_events`
- `audit_events`
- `communication_events`
- `digital_approvals`

---

## 6. Audit Fields and Soft Delete Strategy

### 6.1 Mutable business tables
Mutable business tables should use:
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`
- `row_version`

### 6.2 Soft-deletable tables
Soft delete should be allowed for:
- `customers`
- `customer_contacts`
- `measurement_records`
- `service_orders` only before irreversible downstream financial or production closure rules are reached
- `service_order_items` only under parent-order governance
- `operational_resources`
- `storage_locations`
- `workflow_definitions`
- `status_definitions`
- `sla_rules`

Soft delete should use:
- `is_deleted`
- `deleted_at`
- `deleted_by`

### 6.3 Non-soft-deletable tables
The following tables must remain append-only or hard-protected from logical disappearance:
- `production_execution_events`
- `qr_events`
- `custody_events`
- `audit_events`
- `communication_events`
- `digital_approvals`
- `payment_records`
- `partial_payments`
- `financial_exceptions`
- `fiscal_documents`

### 6.4 Audit-protection rule
If a parent transactional record is soft-deleted, its child audit and event records must remain fully queryable.

---

## 7. Physical Tables

### 7.1 Tenant Governance tables

#### `tenants`
| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid | yes | primary key |
| code | varchar(50) | yes | business tenant code |
| legal_name | text | yes | legal identity |
| display_name | text | yes | operational display identity |
| status | varchar(30) | yes | active/inactive lifecycle |
| created_at | timestamptz | yes | audit |
| created_by | uuid | yes | actor reference |
| updated_at | timestamptz | yes | audit |
| updated_by | uuid | yes | actor reference |
| row_version | bigint | yes | optimistic concurrency |

Constraints:
- PK: `id`
- UQ: `code`
- CHECK: `status` in approved tenant lifecycle values

#### `branches`
| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid | yes | primary key |
| tenant_id | uuid | yes | FK to `tenants.id` |
| code | varchar(50) | yes | branch code scoped to tenant |
| legal_name | text | yes | branch legal/registered identity |
| display_name | text | yes | branch display name |
| status | varchar(30) | yes | branch lifecycle |
| parent_branch_id | uuid | no | self-reference when hierarchy exists |
| business_calendar_name | text | no | branch calendar reference label |
| created_at | timestamptz | yes | audit |
| created_by | uuid | yes | audit |
| updated_at | timestamptz | yes | audit |
| updated_by | uuid | yes | audit |
| row_version | bigint | yes | concurrency |

Constraints:
- PK: `id`
- FK: `tenant_id -> tenants.id`
- FK: `parent_branch_id -> branches.id`
- UQ: `(tenant_id, code)`

### 7.2 Customer and CRM tables

#### `customers`
| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid | yes | primary key |
| tenant_id | uuid | yes | FK to `tenants.id` |
| branch_id | uuid | no | nullable when tenant-wide |
| customer_type | varchar(20) | yes | person/company classification |
| legal_name | text | yes | normalized main name |
| trade_name | text | no | optional display/commercial name |
| cpf_cnpj | varchar(20) | no | normalized identity field |
| email | text | no | primary contact email |
| phone | varchar(40) | no | normalized phone |
| address_line_1 | text | no | address |
| address_line_2 | text | no | address complement |
| district | text | no | address area |
| city | text | no | address city |
| state | varchar(10) | no | address state |
| postal_code | varchar(20) | no | address postal code |
| status | varchar(30) | yes | active/inactive/blocked |
| created_at | timestamptz | yes | audit |
| created_by | uuid | yes | audit |
| updated_at | timestamptz | yes | audit |
| updated_by | uuid | yes | audit |
| is_deleted | boolean | yes | soft delete |
| deleted_at | timestamptz | no | soft delete |
| deleted_by | uuid | no | soft delete |
| row_version | bigint | yes | concurrency |

Constraints:
- PK: `id`
- FK: `tenant_id -> tenants.id`
- FK: `branch_id -> branches.id`
- duplicate CPF/CNPJ values are allowed physically so onboarding duplicate-detection and review workflows can stage and resolve legacy duplicates before business consolidation
- CHECK: `customer_type` in approved customer-type values

#### `customer_contacts`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `customer_id uuid FK -> customers.id`
- `contact_name text`
- `contact_role varchar(100)`
- `email text`
- `phone varchar(40)`
- `is_primary boolean`
- standard audit + soft-delete columns

Constraints:
- FK: `customer_id -> customers.id`
- UQ: one active primary contact per customer when `is_primary = true`

#### `customer_interactions`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `customer_id uuid FK -> customers.id`
- `service_order_id uuid null FK -> service_orders.id`
- `interaction_type varchar(50)`
- `channel varchar(50)`
- `occurred_at timestamptz`
- `summary text`
- `detail text`
- standard audit columns

Constraints:
- FK: `customer_id -> customers.id`
- FK: `service_order_id -> service_orders.id`

#### `measurement_records`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `customer_id uuid FK -> customers.id`
- `service_order_id uuid null FK -> service_orders.id`
- `measurement_label varchar(120)`
- `measurement_data jsonb`
- `version_no integer`
- `measured_at timestamptz`
- `captured_by uuid`
- standard audit + soft-delete columns

Constraints:
- FK: `customer_id -> customers.id`
- FK: `service_order_id -> service_orders.id`
- UQ: `(customer_id, measurement_label, version_no)`

### 7.3 Service Order tables

#### `service_orders`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `customer_id uuid FK -> customers.id`
- `workflow_definition_id uuid null FK -> workflow_definitions.id`
- `current_status_definition_id uuid null FK -> status_definitions.id`
- `order_no varchar(50) not null`
- `opened_at timestamptz`
- `promised_delivery_date date`
- `delivery_type varchar(20)` with approved taxonomy `Standard`, `Priority`, `Express`
- `commercial_responsible_actor_id uuid`
- `technical_measurement_responsible_actor_id uuid`
- `commercial_notes text`
- `customer_notes text`
- `total_value numeric(18,2) null`
- `discount_value numeric(18,2) null`
- standard audit + soft-delete columns

Constraints:
- PK: `id`
- FK: `tenant_id -> tenants.id`
- FK: `branch_id -> branches.id`
- FK: `customer_id -> customers.id`
- FK: `workflow_definition_id -> workflow_definitions.id`
- FK: `current_status_definition_id -> status_definitions.id`
- UQ: `(tenant_id, order_no)`
- CHECK: `delivery_type` in (`Standard`, `Priority`, `Express`)

#### `service_order_items`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `service_order_id uuid FK -> service_orders.id`
- `item_no integer`
- `item_type varchar(50)`
- `description text`
- `quantity numeric(18,4)`
- `unit_price numeric(18,2) null`
- `discount_value numeric(18,2) null`
- `status varchar(30)`
- standard audit + soft-delete columns

Constraints:
- FK: `service_order_id -> service_orders.id`
- UQ: `(service_order_id, item_no)`
- CHECK: `quantity > 0`

### 7.4 Production tables

#### `production_orders`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `service_order_id uuid FK -> service_orders.id`
- `workflow_definition_id uuid null FK -> workflow_definitions.id`
- `current_status_definition_id uuid null FK -> status_definitions.id`
- `production_no varchar(50) not null`
- `production_type varchar(50)`
- `delivery_type varchar(20)`
- `operational_priority varchar(30)`
- `customer_delivery_target_date date`
- `internal_production_deadline date null`
- `internal_quality_deadline date null`
- `planned_quantity numeric(18,4)`
- `produced_quantity numeric(18,4)`
- `scheduled_start_at timestamptz null`
- `scheduled_end_at timestamptz null`
- `instructions text`
- `piece_description text`
- `measurements_snapshot jsonb null`
- `observations text`
- standard audit + soft-delete columns

Constraints:
- FK: `service_order_id -> service_orders.id`
- FK: `workflow_definition_id -> workflow_definitions.id`
- FK: `current_status_definition_id -> status_definitions.id`
- UQ: `(tenant_id, production_no)`
- UQ: filtered uniqueness on `(service_order_id)` for active rows where `is_deleted = false` to preserve exactly one active base production-order row per service order while still allowing historical soft-deleted lineage records if a governed replacement is ever required
- CHECK: `delivery_type` in (`Standard`, `Priority`, `Express`)
- reconciliation rule: where older source wording suggests rework may open a new Production Order, this approved physical model resolves that path through execution-capable `production_order_versions` under the single base `production_orders` row rather than through additional base Production Order rows

#### `production_order_item_links`
Purpose:
- stores the originating Service Order Item reference set for the single order-scoped Production Order

Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `production_order_id uuid FK -> production_orders.id`
- `service_order_item_id uuid FK -> service_order_items.id`
- `is_primary_scope boolean`
- standard audit columns

Constraints:
- UQ: `(production_order_id, service_order_item_id)`

#### `production_order_versions`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `production_order_id uuid FK -> production_orders.id`
- `version_no integer`
- `version_reason varchar(50)`
- `is_active boolean`
- `is_draft boolean`
- `production_type varchar(50) null`
- `delivery_type varchar(20) null`
- `operational_priority varchar(30) null`
- `change_summary text`
- `planned_quantity numeric(18,4) null`
- `scheduled_start_at timestamptz null`
- `scheduled_end_at timestamptz null`
- `instructions text null`
- `piece_description text null`
- `measurements_snapshot jsonb null`
- `observations text null`
- `resource_change_notes text null`
- standard audit columns

Constraints:
- UQ: `(production_order_id, version_no)`
- CHECK: `version_no >= 2`
- CHECK: approved `version_reason` values reflect rework, warranty execution, or corrective production
- corrective execution rule: each version row carries the full operational state needed for corrective execution while remaining subordinate to the base `production_orders` row

#### `production_order_operational_assignments`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `production_order_id uuid FK -> production_orders.id`
- `operational_resource_id uuid FK -> operational_resources.id`
- `assignment_role varchar(50)`
- `assigned_at timestamptz`
- `released_at timestamptz null`
- `is_current boolean`
- `is_primary_responsible boolean`
- `assignment_notes text null`
- standard audit columns

Constraints:
- CHECK: `released_at` is null or `released_at >= assigned_at`
- UQ: filtered uniqueness on `(production_order_id)` when `is_current = true`
- UQ: filtered uniqueness on `(production_order_id)` when `is_current = true and is_primary_responsible = true`
- CHECK: `is_current = false or is_primary_responsible = true`
- assignment-lifecycle rule: historical assignment rows may coexist for the same Production Order, but only one row may remain current at a time, any current row must be the current primary-responsible row, and any Production Order that has entered active execution-capable lifecycle states must have exactly one current primary-responsible assignment enforced by its workflow/application activation path

#### `production_execution_events`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `production_order_id uuid FK -> production_orders.id`
- `production_order_version_id uuid null FK -> production_order_versions.id`
- `operational_resource_id uuid null FK -> operational_resources.id`
- `qr_event_id uuid null FK -> qr_events.id`
- `event_type varchar(60)`
- `event_at timestamptz`
- `status_before varchar(30) null`
- `status_after varchar(30) null`
- `diary_entry text null`
- `event_payload jsonb null`
- `recorded_by uuid`

Constraints:
- immutable append-only table
- CHECK: event types cover execution start, responsibility assumption, status update, workflow registration, and diary update

### 7.5 Operational Resource tables

#### `operational_resources`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `home_branch_id uuid null FK -> branches.id`
- `resource_type varchar(30)` for employee/daily_worker/contractor
- `display_name text`
- `document_no varchar(50) null`
- `phone varchar(40) null`
- `email text null`
- `skill_profile jsonb null`
- `qualification_notes text null`
- `status varchar(30)`
- standard audit + soft-delete columns

Constraints:
- CHECK: `resource_type` in approved operational-resource values

#### `operational_resource_branch_scopes`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `operational_resource_id uuid FK -> operational_resources.id`
- `branch_id uuid FK -> branches.id`
- `valid_from date`
- `valid_to date null`
- `scope_role varchar(50) null`
- standard audit columns

Constraints:
- UQ: `(operational_resource_id, branch_id, valid_from)`
- CHECK: `valid_to` is null or `valid_to >= valid_from`

### 7.6 Quality tables

#### `quality_records`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `production_order_id uuid FK -> production_orders.id`
- `service_order_item_id uuid null FK -> service_order_items.id`
- `workflow_definition_id uuid null FK -> workflow_definitions.id`
- `current_status_definition_id uuid null FK -> status_definitions.id`
- `quality_responsible_actor_id uuid null`
- `inspection_result varchar(30)`
- `inspection_at timestamptz`
- `release_decision varchar(30)`
- `notes text null`
- standard audit columns

Constraints:
- CHECK: approved inspection and release values

#### `customer_rejections`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `service_order_id uuid FK -> service_orders.id`
- `service_order_item_id uuid FK -> service_order_items.id`
- `quality_record_id uuid null FK -> quality_records.id`
- `rejection_reason text`
- `reported_at timestamptz`
- `status varchar(30)`
- standard audit columns

#### `rework_cases`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `production_order_id uuid FK -> production_orders.id`
- `production_order_version_id uuid null FK -> production_order_versions.id`
- `original_operational_resource_id uuid null FK -> operational_resources.id`
- `corrective_operational_resource_id uuid null FK -> operational_resources.id`
- `rework_reason text`
- `opened_at timestamptz`
- `status varchar(30)`
- standard audit columns

#### `warranty_adjustments`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `service_order_id uuid FK -> service_orders.id`
- `service_order_item_id uuid null FK -> service_order_items.id`
- `customer_rejection_id uuid null FK -> customer_rejections.id`
- `adjustment_reason text`
- `opened_at timestamptz`
- `status varchar(30)`
- standard audit columns

#### `warranty_executions`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `service_order_id uuid FK -> service_orders.id`
- `production_order_id uuid FK -> production_orders.id`
- `production_order_version_id uuid null FK -> production_order_versions.id`
- `original_operational_resource_id uuid null FK -> operational_resources.id`
- `corrective_operational_resource_id uuid null FK -> operational_resources.id`
- `execution_reason text`
- `opened_at timestamptz`
- `status varchar(30)`
- standard audit columns

### 7.7 Finance and Fiscal tables

#### `payment_records`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `service_order_id uuid FK -> service_orders.id`
- `payment_reference_no varchar(50) null`
- `payment_method varchar(30)`
- `payment_direction varchar(20)`
- `payment_amount numeric(18,2)`
- `received_at timestamptz null`
- `authorized_at timestamptz null`
- `reconciled_at timestamptz null`
- `status varchar(30)`
- standard audit columns

Constraints:
- CHECK: `payment_amount >= 0`

#### `partial_payments`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `payment_record_id uuid FK -> payment_records.id`
- `service_order_id uuid FK -> service_orders.id`
- `service_order_item_id uuid null FK -> service_order_items.id`
- `allocated_amount numeric(18,2)`
- `allocated_at timestamptz`
- standard audit columns

Constraints:
- CHECK: `allocated_amount > 0`
- CHECK: `service_order_id` is always populated
- implementation invariant: `service_order_item_id` is optional and, when present, must belong to the same `service_order_id`; this should be enforced physically through a composite foreign-key strategy or trigger/application validation rather than a plain single-row CHECK

#### `financial_exceptions`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `service_order_id uuid FK -> service_orders.id`
- `payment_record_id uuid null FK -> payment_records.id`
- `exception_type varchar(40)`
- `reason text`
- `opened_at timestamptz`
- `resolved_at timestamptz null`
- `status varchar(30)`
- standard audit columns

#### `fiscal_documents`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `service_order_id uuid FK -> service_orders.id`
- `service_order_item_id uuid null FK -> service_order_items.id`
- `document_type varchar(40)`
- `document_no varchar(60)`
- `issued_at timestamptz`
- `status varchar(30)`
- `gross_amount numeric(18,2) null`
- standard audit columns

Constraints:
- UQ: `(tenant_id, branch_id, document_type, document_no)`

### 7.8 Delivery and Pickup tables

#### `pickup_authorizations`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `service_order_id uuid FK -> service_orders.id`
- `authorized_person_name text`
- `authorized_person_document varchar(50) null`
- `authorization_path varchar(30)`
- `valid_from timestamptz`
- `valid_until timestamptz`
- `status varchar(30)`
- standard audit columns

Constraints:
- CHECK: `valid_until >= valid_from`

#### `pickup_tokens`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `pickup_authorization_id uuid FK -> pickup_authorizations.id`
- `token_value text`
- `issued_at timestamptz`
- `expires_at timestamptz`
- `used_at timestamptz null`
- `status varchar(30)`
- standard audit columns

Constraints:
- UQ: `(pickup_authorization_id, token_value)`
- CHECK: `expires_at >= issued_at`
- CHECK: `used_at` is null or `used_at >= issued_at`

#### `pickup_qr_codes`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `pickup_authorization_id uuid FK -> pickup_authorizations.id`
- `code_value text`
- `issued_at timestamptz`
- `expires_at timestamptz`
- `used_at timestamptz null`
- `status varchar(30)`
- standard audit columns

Constraints:
- UQ: `(pickup_authorization_id, code_value)`
- CHECK: `expires_at >= issued_at`
- CHECK: `used_at` is null or `used_at >= issued_at`

#### `temporary_pickup_codes`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `pickup_authorization_id uuid FK -> pickup_authorizations.id`
- `code_value varchar(50)`
- `issued_at timestamptz`
- `expires_at timestamptz`
- `used_at timestamptz null`
- `status varchar(30)`
- standard audit columns

Constraints:
- UQ: `(pickup_authorization_id, code_value)`
- CHECK: `expires_at >= issued_at`
- CHECK: `used_at` is null or `used_at >= issued_at`

#### `storage_locations`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `area varchar(50) null`
- `corridor varchar(50) null`
- `row_code varchar(50) null`
- `shelf_code varchar(50) null`
- `cabinet_code varchar(50) null`
- `drawer_code varchar(50) null`
- `display_label text`
- `status varchar(30)`
- standard audit + soft-delete columns

Constraints:
- UQ: `(tenant_id, branch_id, area, corridor, row_code, shelf_code, cabinet_code, drawer_code)`

#### `storage_location_assignments`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `service_order_id uuid FK -> service_orders.id`
- `storage_location_id uuid FK -> storage_locations.id`
- `assigned_at timestamptz`
- `released_at timestamptz null`
- `is_current boolean`
- `assignment_reason varchar(50) null`
- standard audit columns

Constraints:
- CHECK: `released_at` is null or `released_at >= assigned_at`
- UQ: filtered uniqueness on `(service_order_id)` when `is_current = true`
- CHECK: `is_current = true` requires `released_at is null`, and `released_at is not null` requires `is_current = false`

#### `physical_bag_support_contexts`
Purpose:
- optional support-only physical container context for storing Service Order pieces and the printed Production Order

Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `service_order_id uuid FK -> service_orders.id`
- `production_order_id uuid null FK -> production_orders.id`
- `storage_location_assignment_id uuid null FK -> storage_location_assignments.id`
- `bag_label text null`
- `notes text null`
- `in_use boolean`
- standard audit columns

Constraints:
- CHECK: `service_order_id` is always populated
- current-context rule: at most one active/current bag support-context row should exist per `service_order_id`, enforced through filtered uniqueness or equivalent lifecycle control
- implementation invariant: when `production_order_id` is populated, the referenced Production Order must belong to the same `service_order_id`; this should be enforced through a composite foreign-key strategy or trigger/application validation rather than a plain single-row CHECK
- no independent business numbering, QR code, or workflow columns are allowed in this table
- the surrogate `id` is a technical row identifier only and does not constitute independent business identity

### 7.9 Workflow and SLA tables

#### `workflow_definitions`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `workflow_scope varchar(40)`
- `workflow_name text`
- `is_active boolean`
- `visibility_rules jsonb null`
- `approval_rules jsonb null`
- `escalation_rules jsonb null`
- standard audit + soft-delete columns

Constraints:
- UQ: `(tenant_id, workflow_scope, workflow_name)`

#### `status_definitions`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `workflow_definition_id uuid FK -> workflow_definitions.id`
- `status_code varchar(40)`
- `status_name text`
- `sequence_no integer`
- `is_start boolean`
- `is_terminal boolean`
- `visibility_role_scope jsonb null`
- standard audit + soft-delete columns

Constraints:
- UQ: `(workflow_definition_id, status_code)`
- UQ: filtered uniqueness on `(workflow_definition_id)` when `is_start = true`

#### `sla_rules`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `workflow_definition_id uuid FK -> workflow_definitions.id`
- `rule_name text`
- `calendar_scope varchar(30)`
- `target_duration_hours numeric(18,2) null`
- `buffer_days numeric(18,2) null`
- `is_active boolean`
- standard audit + soft-delete columns

#### `sla_rule_triggers`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `sla_rule_id uuid FK -> sla_rules.id`
- `status_definition_id uuid null FK -> status_definitions.id`
- `trigger_event_code varchar(60) null`
- `trigger_role varchar(20)` for start/pause/resume/complete/violation
- `sequence_no integer`
- standard audit columns

Constraints:
- CHECK: exactly one of `status_definition_id` or `trigger_event_code` is populated
- UQ: `(sla_rule_id, trigger_role, status_definition_id, trigger_event_code)`

### 7.10 QR and Operational Tracking tables

#### `qr_codes`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `production_order_id uuid FK -> production_orders.id`
- `reissue_no integer`
- `code_value text`
- `issued_at timestamptz`
- `is_active boolean`
- `revoked_at timestamptz null`
- standard audit columns

Constraints:
- UQ: `(production_order_id, reissue_no)`
- UQ: filtered uniqueness on `(production_order_id)` when `is_active = true`
- UQ: `(tenant_id, code_value)`
- CHECK: `reissue_no >= 1`
- CHECK: `is_active = true` requires `revoked_at is null`, and `revoked_at is not null` requires `is_active = false`
- required lifecycle rule: every base Production Order must obtain one active QR row no later than its operational activation, and any transition into active execution-capable lifecycle states must be blocked until that active QR row exists

#### `qr_events`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `qr_code_id uuid FK -> qr_codes.id`
- `production_order_id uuid FK -> production_orders.id`
- `operational_resource_id uuid null FK -> operational_resources.id`
- `scan_type varchar(60)`
- `scanned_code_value text`
- `scanned_at timestamptz`
- `scan_result varchar(30)`
- `event_payload jsonb null`
- `recorded_by uuid`

Constraints:
- immutable append-only table

### 7.11 Audit and Traceability tables

#### `custody_events`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid FK -> branches.id`
- `service_order_id uuid null FK -> service_orders.id`
- `production_order_id uuid null FK -> production_orders.id`
- `pickup_authorization_id uuid null FK -> pickup_authorizations.id`
- `event_stage varchar(50)`
- `event_at timestamptz`
- `actor_id uuid null`
- `notes text null`
- `evidence_summary jsonb null`

Constraints:
- immutable append-only table
- CHECK: at least one governed business reference is present
- lineage rule: when more than one of `service_order_id`, `production_order_id`, and `pickup_authorization_id` is populated, all populated references must resolve to the same Service Order lineage

#### `audit_events`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid null FK -> branches.id`
- `aggregate_type varchar(60)`
- `aggregate_id uuid`
- `event_type varchar(60)`
- `action_name varchar(60)`
- `prior_state jsonb null`
- `resulting_state jsonb null`
- `actor_id uuid null`
- `recorded_at timestamptz`
- `context_data jsonb null`

Constraints:
- immutable append-only table

#### `cctv_references`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `custody_event_id uuid FK -> custody_events.id`
- `source_label text`
- `captured_at timestamptz`
- `reference_uri text`
- `notes text null`

Constraints:
- immutable once attached to custody event

#### `camera_snapshots`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `custody_event_id uuid FK -> custody_events.id`
- `captured_at timestamptz`
- `reference_uri text`
- `notes text null`

Constraints:
- immutable once attached to custody event

### 7.12 Communication and Approval tables

#### `communication_events`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid null FK -> branches.id`
- `customer_id uuid null FK -> customers.id`
- `service_order_id uuid null FK -> service_orders.id`
- `channel varchar(30)`
- `direction varchar(20)`
- `subject text null`
- `message_summary text`
- `sent_at timestamptz`
- `delivery_status varchar(30)`
- `payload_snapshot jsonb null`

Constraints:
- immutable append-only trace table

#### `digital_approvals`
Key columns:
- `id uuid PK`
- `tenant_id uuid FK -> tenants.id`
- `branch_id uuid null FK -> branches.id`
- `service_order_id uuid null FK -> service_orders.id`
- `production_order_id uuid null FK -> production_orders.id`
- `production_order_version_id uuid null FK -> production_order_versions.id`
- `pickup_authorization_id uuid null FK -> pickup_authorizations.id`
- `approval_type varchar(40)`
- `decision varchar(20)`
- `decided_at timestamptz`
- `decided_by uuid null`
- `decision_notes text null`
- `evidence_payload jsonb null`

Constraints:
- CHECK: exactly one approval-target shape is allowed: standalone `service_order_id`; or `production_order_id` together with its parent `service_order_id`; or `production_order_version_id` together with its parent `service_order_id`; or standalone `pickup_authorization_id`
- implementation invariant: when `production_order_id` is populated, `service_order_id` must equal the parent Service Order reached through the referenced Production Order; this should be enforced through composite foreign keys, trigger validation, or application-governed write paths rather than a plain single-row CHECK
- implementation invariant: when `production_order_version_id` is populated, `service_order_id` must equal the parent Service Order reached through the referenced Production Order lineage; this should be enforced through composite foreign keys, trigger validation, or application-governed write paths rather than a plain single-row CHECK
- immutable decision trace after final decision

---

## 8. Primary Key Strategy

- every physical table uses `id uuid` as primary key
- parent-child traceability is preserved through explicit foreign keys rather than composite primary keys
- bridge and event tables also use UUID primary keys to support cross-table audit references

---

## 9. Foreign Key Strategy

### 9.1 Core lineage
- `branches.tenant_id -> tenants.id`
- `customers.tenant_id -> tenants.id`
- `service_orders.customer_id -> customers.id`
- `service_orders.branch_id -> branches.id`
- `service_order_items.service_order_id -> service_orders.id`
- `production_orders.service_order_id -> service_orders.id`
- `production_order_versions.production_order_id -> production_orders.id`

### 9.2 Execution and QR lineage
- `production_order_item_links.production_order_id -> production_orders.id`
- `production_order_item_links.service_order_item_id -> service_order_items.id`
- `production_order_operational_assignments.production_order_id -> production_orders.id`
- `production_order_operational_assignments.operational_resource_id -> operational_resources.id`
- `qr_codes.production_order_id -> production_orders.id`
- `qr_events.qr_code_id -> qr_codes.id`
- `qr_events.production_order_id -> production_orders.id`

### 9.3 Quality and corrective lineage
- `quality_records.production_order_id -> production_orders.id`
- `customer_rejections.service_order_item_id -> service_order_items.id`
- `rework_cases.production_order_id -> production_orders.id`
- `warranty_adjustments.service_order_id -> service_orders.id`
- `warranty_executions.production_order_id -> production_orders.id`

### 9.4 Financial lineage
- `payment_records.service_order_id -> service_orders.id`
- `partial_payments.payment_record_id -> payment_records.id`
- `financial_exceptions.service_order_id -> service_orders.id`
- `fiscal_documents.service_order_id -> service_orders.id`

### 9.5 Delivery and traceability lineage
- `pickup_authorizations.service_order_id -> service_orders.id`
- `pickup_tokens.pickup_authorization_id -> pickup_authorizations.id`
- `pickup_qr_codes.pickup_authorization_id -> pickup_authorizations.id`
- `temporary_pickup_codes.pickup_authorization_id -> pickup_authorizations.id`
- `storage_location_assignments.service_order_id -> service_orders.id`
- `storage_location_assignments.storage_location_id -> storage_locations.id`
- `physical_bag_support_contexts.production_order_id -> production_orders.id`
- `custody_events.service_order_id -> service_orders.id`
- `custody_events.production_order_id -> production_orders.id`

### 9.6 Workflow lineage
- `status_definitions.workflow_definition_id -> workflow_definitions.id`
- `sla_rules.workflow_definition_id -> workflow_definitions.id`
- `sla_rule_triggers.sla_rule_id -> sla_rules.id`
- `sla_rule_triggers.status_definition_id -> status_definitions.id`
- transactional workflow references point to `workflow_definitions` and `status_definitions`

---

## 10. Constraint Strategy

### 10.1 Uniqueness constraints
- tenant codes must be unique
- branch codes must be unique within tenant
- customer identity documents may repeat during migration staging and must be resolved through duplicate-detection and review workflows rather than through unconditional hard uniqueness
- service order numbers must be unique within tenant
- production order numbers must be unique within tenant
- fiscal document numbers must be unique by tenant, branch, and document type
- active QR codes must remain one-to-one with Production Order

### 10.2 Cardinality constraints
- exactly one base `production_orders` row per `service_orders` row
- one-to-many child rows for Service Order Items, Production Order Versions, Quality Records, Financial records, and Pickup artifacts
- at most one active current storage assignment per service order

### 10.3 Check constraints
- enforce approved delivery-type taxonomy
- prevent negative quantities and negative partial allocations
- prevent invalid date ranges
- prevent invalid approval references
- prevent unsupported version reasons
- prevent bag-support rows from gaining forbidden identity concepts

### 10.4 Referential rules
- parent deletion must not orphan financial, audit, event, quality, or production lineage
- event and audit rows remain preserved even when parent business rows are soft-deleted

---

## 11. Workflow Tables

Workflow is physically represented through:
- `workflow_definitions`
- `status_definitions`
- `sla_rules`
- `sla_rule_triggers`

Transactional linkage is achieved through:
- `service_orders.workflow_definition_id`
- `service_orders.current_status_definition_id`
- `production_orders.workflow_definition_id`
- `production_orders.current_status_definition_id`
- `quality_records.workflow_definition_id`
- `quality_records.current_status_definition_id`

This preserves:
- policy reuse
- explicit current status
- multi-status and event-based SLA trigger mapping
- tenant-specific workflow behavior
- SLA governance without moving source-of-truth ownership away from transactional tables

---

## 12. Event Tables

Primary physical event tables:
- `production_execution_events`
- `qr_events`
- `custody_events`
- `communication_events`
- `audit_events`

Event rules:
- event tables are append-only
- event records capture actor, time, type, and context
- QR events preserve the scanned QR value snapshot so historical reissues remain distinguishable
- event tables do not replace transactional source-of-truth tables
- Production Order execution events remain anchored to Production Order, not to bag support context

---

## 13. Audit Tables

Primary audit-trace tables:
- `audit_events`
- `custody_events`
- `cctv_references`
- `camera_snapshots`
- `digital_approvals`

Audit rules:
- `audit_events` captures cross-domain immutable trace
- `custody_events` captures handoff-stage physical traceability
- CCTV and camera records are evidence references, not operational source-of-truth tables
- `digital_approvals` preserves final approval decisions and evidence payload

---

## 14. Financial Tables

Physical financial tables:
- `payment_records`
- `partial_payments`
- `financial_exceptions`
- `fiscal_documents`

Financial-source-of-truth rule:
- Service Order remains the commercial and financial anchor
- Production Order must not receive price, discount, commission, margin, or profit ownership

Allocation rule:
- every `partial_payments` row remains anchored to `service_order_id`, and `service_order_item_id` is optional when the allocation narrows from order scope to a specific item scope

---

## 15. Production Tables

Physical production tables:
- `production_orders`
- `production_order_item_links`
- `production_order_versions`
- `production_order_operational_assignments`
- `production_execution_events`
- `qr_codes`
- `qr_events`

Operational-source-of-truth rule:
- `production_orders` is the single base operational anchor per service order
- `production_order_versions` refines lineage only for rework, warranty execution, or corrective production
- `production_order_item_links` preserves the item-reference set without creating item-level production roots

---

## 16. Quality Tables

Physical quality tables:
- `quality_records`
- `customer_rejections`
- `rework_cases`
- `warranty_adjustments`
- `warranty_executions`

Quality-lineage rule:
- all corrective tables must preserve original Production Order lineage
- warranty execution remains operationally linked
- warranty adjustment remains commercially anchored through Service Order / Service Order Item scope

---

## 17. Operational Resource Tables

Physical operational-resource tables:
- `operational_resources`
- `operational_resource_branch_scopes`
- `production_order_operational_assignments`
- `production_execution_events`

Responsibility rule:
- commercial and technical measurement responsibilities stay in Service Order scope
- operational responsibility is defined physically by assignment and execution-event history
- quality responsibility is defined through quality workflow and quality records

---

## 18. Physical Relationship Matrix

| Parent Table | Child Table | FK Column | Relationship Meaning |
|---|---|---|---|
| `tenants` | `branches` | `branches.tenant_id` | one tenant owns many branches |
| `tenants` | `customers` | `customers.tenant_id` | one tenant owns many customers |
| `customers` | `customer_contacts` | `customer_contacts.customer_id` | one customer owns many contacts |
| `customers` | `customer_interactions` | `customer_interactions.customer_id` | one customer owns many interactions |
| `customers` | `measurement_records` | `measurement_records.customer_id` | one customer owns many measurement records |
| `customers` | `service_orders` | `service_orders.customer_id` | one customer places many service orders |
| `service_orders` | `service_order_items` | `service_order_items.service_order_id` | one service order contains many items |
| `service_orders` | `production_orders` | `production_orders.service_order_id` | one service order generates one base production order |
| `production_orders` | `production_order_item_links` | `production_order_item_links.production_order_id` | one production order references many service order items |
| `production_orders` | `production_order_versions` | `production_order_versions.production_order_id` | one production order has many versions |
| `production_orders` | `production_order_operational_assignments` | `production_order_operational_assignments.production_order_id` | one production order has many resource assignments over time |
| `production_orders` | `production_execution_events` | `production_execution_events.production_order_id` | one production order has many execution events |
| `production_orders` | `qr_codes` | `qr_codes.production_order_id` | one production order may own many QR identity rows over time but only one active QR row |
| `qr_codes` | `qr_events` | `qr_events.qr_code_id` | one QR code emits many QR events |
| `production_orders` | `quality_records` | `quality_records.production_order_id` | one production order has many quality records |
| `production_orders` | `rework_cases` | `rework_cases.production_order_id` | one production order may have many rework cases |
| `production_orders` | `warranty_executions` | `warranty_executions.production_order_id` | one production order may have many warranty execution cases |
| `service_orders` | `payment_records` | `payment_records.service_order_id` | one service order has many payment records |
| `payment_records` | `partial_payments` | `partial_payments.payment_record_id` | one payment record has many partial allocations |
| `service_orders` | `financial_exceptions` | `financial_exceptions.service_order_id` | one service order may have many financial exceptions |
| `service_orders` | `fiscal_documents` | `fiscal_documents.service_order_id` | one service order may have many fiscal documents |
| `service_orders` | `pickup_authorizations` | `pickup_authorizations.service_order_id` | one service order may have many pickup authorizations |
| `pickup_authorizations` | `pickup_tokens` | `pickup_tokens.pickup_authorization_id` | one authorization may issue many tokens |
| `pickup_authorizations` | `pickup_qr_codes` | `pickup_qr_codes.pickup_authorization_id` | one authorization may issue many pickup QR codes |
| `pickup_authorizations` | `temporary_pickup_codes` | `temporary_pickup_codes.pickup_authorization_id` | one authorization may issue many temporary codes |
| `storage_locations` | `storage_location_assignments` | `storage_location_assignments.storage_location_id` | one location may be assigned many times |
| `service_orders` | `storage_location_assignments` | `storage_location_assignments.service_order_id` | one service order has many location assignments over time |
| `service_orders` | `physical_bag_support_contexts` | `physical_bag_support_contexts.service_order_id` | one service order may use many support bag contexts |
| `production_orders` | `physical_bag_support_contexts` | `physical_bag_support_contexts.production_order_id` | one production order may use many support bag contexts |
| `workflow_definitions` | `status_definitions` | `status_definitions.workflow_definition_id` | one workflow defines many statuses |
| `workflow_definitions` | `sla_rules` | `sla_rules.workflow_definition_id` | one workflow defines many SLA rules |
| `sla_rules` | `sla_rule_triggers` | `sla_rule_triggers.sla_rule_id` | one SLA rule may define many trigger mappings |
| `service_orders` | `custody_events` | `custody_events.service_order_id` | one service order may emit many custody events |
| `production_orders` | `custody_events` | `custody_events.production_order_id` | one production order may emit many custody events |
| `custody_events` | `cctv_references` | `cctv_references.custody_event_id` | one custody event may have many CCTV references |
| `custody_events` | `camera_snapshots` | `camera_snapshots.custody_event_id` | one custody event may have many snapshots |

---

## 19. Audit Strategy

### 19.1 Cross-domain audit
`audit_events` is the canonical immutable cross-domain audit table.

Each row must capture:
- tenant
- optional branch
- aggregate type
- aggregate id
- event type
- action name
- actor
- timestamp
- prior state context where relevant
- resulting state context where relevant

### 19.2 Operational audit
Operational execution audit is represented through:
- `production_execution_events`
- `qr_events`
- `production_order_operational_assignments`

### 19.3 Physical custody audit
Physical traceability is represented through:
- `custody_events`
- `cctv_references`
- `camera_snapshots`

### 19.4 Approval audit
Approval traceability is represented through:
- `digital_approvals`

### 19.5 Delete-audit rule
Soft deletion of mutable business records must not remove or alter related immutable audit and event history.

---

## 20. Remaining Physical Modeling Risks

- user and identity-domain tables are still external to this physical document, so actor references remain UUID-based integration points rather than fully specified internal foreign keys
- partial-payment allocation across many item scopes may need stricter posting rules and balancing constraints
- warranty-adjustment versus warranty-execution state machines may need finer physical status catalogs during implementation
- storage-location assignment is order-level by default and may need future extension if some tenants require item-level storage granularity
- workflow reuse across multiple transactional domains may later justify additional transition-policy tables if status logic becomes more granular

---

## 21. Database Readiness Score

**Score: 94/100**

Rationale:
- the physical table set covers the approved conceptual and logical entities
- source-of-truth separation remains preserved in table ownership
- PostgreSQL-oriented key, audit, tenant, branch, and soft-delete strategies are explicit
- workflow, event, audit, financial, production, quality, and operational-resource tables are defined
- remaining deductions apply mainly to identity integration details and a few implementation-adjacent refinement areas, not to the viability of physical database implementation

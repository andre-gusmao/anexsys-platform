# ANEXSYS Platform
# ARQUITETURA_V1

## 1. Purpose

This document defines the high-level business architecture intent for ANEXSYS based on the approved operational model.

This document defines:
- business-domain separation
- source-of-truth boundaries
- operational ownership intent
- conceptual architectural responsibilities
- workflow and audit direction

This document does not define:
- SQL
- tables
- schemas
- APIs
- infrastructure
- deployment topology

---

## 2. Executive Summary

ANEXSYS must be architected around a strict separation between commercial truth and operational truth.

Authoritative business intent:
- Service Order = commercial and financial source of truth
- Production Order = operational execution source of truth
- Physical Bag = physical support element only

The operational model is:
- 1 Customer may have multiple Service Orders
- 1 Service Order contains multiple Service Order Items
- 1 Service Order generates exactly 1 Primary Production Order
- the Primary Production Order may contain all Service Order Items belonging to that Service Order
- the physical bag only stores the Service Order pieces and the printed Production Order (A5)
- QR Codes belong exclusively to the Production Order
- Operational Resources interact operationally by scanning the Production Order QR Code

This architecture must prevent the physical bag from becoming a separate business authority.

---

## 3. Architectural Principles

### 3.1 Source-of-truth separation

The platform must preserve distinct business authorities:
- Service Order owns commercial and financial meaning
- Production Order owns operational execution meaning
- the physical bag owns no independent business truth

### 3.2 Single operational execution anchor

Operational execution must be anchored in the Production Order, not in the physical bag.

### 3.3 Physical support demotion

The physical bag is only a support element for storage and transport.

It must not require:
- business numbering
- independent QR Code
- independent business identity
- independent workflow

### 3.4 Audit-first execution model

Operational responsibility, workflow events, status changes, and corrective version lineage must be fully auditable.

---

## 4. Domain Intent

### 4.1 Customer domain intent

The Customer domain owns the business relationship with the customer across multiple Service Orders.

### 4.2 Service Order domain intent

The Service Order domain owns:
- commercial commitment
- financial truth
- customer-facing lifecycle
- item scope
- promised delivery commitment

### 4.3 Production domain intent

The Production domain owns:
- Primary Production Order generation
- production execution
- operational assignment
- production status progression
- operational event capture
- version lineage for rework, warranty execution, and corrective production

### 4.4 Physical bag intent

The physical bag is only a physical container used to hold:
- pieces belonging to a Service Order
- the printed Production Order (A5)

The bag follows the Service Order and its Production Order.

The bag itself is not the operational source of truth.

### 4.5 Quality and corrective intent

Quality, rework, warranty execution, and corrective production must remain linked to the originating Production Order lineage.

---

## 5. Service Order / Production Order Model

### 5.1 Customer to Service Order

1 Customer
-> may have multiple Service Orders

### 5.2 Service Order to Service Order Items

1 Service Order
-> contains multiple Service Order Items

### 5.3 Service Order to Primary Production Order

1 Service Order
-> generates exactly 1 Primary Production Order

### 5.4 Primary Production Order scope

The Primary Production Order may contain all Service Order Items belonging to that Service Order.

The Primary Production Order is the operational execution anchor for that Service Order.

---

## 6. Production Order Responsibility Model

Operational Resources use the Production Order QR Code to:
- start execution
- assume operational responsibility
- update production status
- register workflow events
- update the Operational Diary

Operational responsibility must therefore be defined through Production Order execution events.

---

## 7. Production Order Versioning Intent

### 7.1 Versioning scope

Production Order versioning is used only for:
- rework
- warranty execution
- corrective production

### 7.2 Version lineage

Illustrative lineage:
- Production Order V1
- Production Order V2
- Production Order V3

### 7.3 Mandatory preservation rules

Versioning must preserve:
- Original Production Order
- Original Operational Resource
- Corrective Operational Resource
- Audit history

### 7.4 Architectural rule

Versioning refines the original Production Order lineage.

It must not redefine the Service Order as a new commercial source of truth.

---

## 8. QR and Workflow Intent

### 8.1 QR ownership

QR Codes belong exclusively to the Production Order.

### 8.2 Workflow ownership

Operational workflow events must be registered against the Production Order execution flow.

The physical bag must not own an independent workflow.

### 8.3 Diary ownership

Operational Diary updates must be derived from Production Order execution activity.

---

## 9. Physical Bag Rule

The physical bag is only a physical container.

It follows the Service Order and its Production Order.

The bag itself is not the source of truth.

The Production Order is the operational source of truth.

---

## 10. Architectural Consequences

The architecture must support:
- commercial/financial projection from Service Order
- operational execution projection from Production Order
- optional physical visibility of bag/location context without promoting the bag to business authority
- auditable operational responsibility through Production Order scan events
- corrective lineage through Production Order version history

The architecture must avoid:
- treating the physical bag as a primary business entity
- assigning independent identity to the bag
- assigning independent QR ownership to the bag
- assigning independent workflow ownership to the bag
- moving operational source-of-truth authority away from the Production Order

---

## 11. Final Intent Statement

ANEXSYS architecture shall be organized so that:
- Service Order remains the commercial and financial source of truth
- Production Order remains the operational execution source of truth
- the physical bag remains a physical support element only

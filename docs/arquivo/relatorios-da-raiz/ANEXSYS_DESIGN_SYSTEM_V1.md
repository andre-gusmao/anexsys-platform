# ANEXSYS_DESIGN_SYSTEM_V1

## Purpose

This document defines the ANEXSYS Design System using the following source of truth:

- `/home/runner/work/anexsys-platform/anexsys-platform/docs/FRONTEND_ARCHITECTURE_V1.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/docs/FRONTEND_IMPLEMENTATION_V1.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/SAAS_IDENTITY_AND_ACCESS_REDESIGN_V1.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/docs/releases/BASELINE_V3.0.md`

The goal of the ANEXSYS Design System is not only visual beauty.

The goal is to produce a platform experience optimized for:

- comfort
- productivity
- low visual fatigue
- operational speed
- long daily usage sessions

The design system must support continuous 8+ hour usage across administrative, operational, customer-service, finance, concierge, and mobile execution flows.

---

## 1. Design Philosophy

ANEXSYS must feel:

- calm
- clean
- professional
- modern
- efficient

ANEXSYS must avoid:

- visual pollution
- excessive colors
- excessive borders
- ERP-style clutter
- heavy dashboards

### 1.1 Experience direction

The intended product experience is:

- a professional operational workspace
- not a flashy consumer app
- not a dense legacy ERP
- not a chart-heavy BI portal

The correct feeling is a calm, intelligent, high-trust operational control system that helps the user move quickly with minimal friction.

### 1.2 Design principles

#### Calm by default
- neutral backgrounds
- restrained accent usage
- low-noise layout composition
- only one dominant action focus per screen area

#### Productivity first
- actions must be easy to find
- information density must be structured, not chaotic
- repetitive tasks must require minimal navigation and minimal typing

#### Long-session comfort
- dark or heavy saturated interfaces must not be the default requirement for comfort
- bright surfaces must be softened with neutral balance
- spacing, typography, contrast, and hierarchy must reduce cognitive load

#### Operational clarity
- users must instantly understand what requires action now
- the platform must prefer queues, priorities, and next steps over decorative visuals

#### Assistive behavior
- the system should infer context whenever possible
- users must not be forced to type information the platform can derive from identity, branch context, history, or current workflow

---

## 2. Color Palette

### 2.1 Color strategy

The ANEXSYS palette should be inspired by:

- trust
- calm
- focus
- professionalism

Primary design emphasis must avoid aggressive reds and highly saturated colors.

### 2.2 Recommended palette roles

#### Primary colors
Use deep, calm blues as the main interaction and trust color.

Recommended direction:
- Primary 700: deep slate blue
- Primary 600: balanced professional blue
- Primary 500: standard action blue
- Primary 100: very light blue support background

Purpose:
- primary actions
- focused navigation state
- selected context
- links
- trusted confirmations

#### Secondary colors
Use teal or muted cyan as a secondary supporting accent.

Recommended direction:
- Secondary 600: muted teal
- Secondary 500: calm teal accent
- Secondary 100: subtle teal background

Purpose:
- secondary emphasis
- contextual highlights
- assistive UI signals
- non-critical workflow tags

#### Neutral palette
Use a strong neutral scale based on cool gray/slate.

Recommended direction:
- Neutral 950: deep text
- Neutral 800: primary content text
- Neutral 700: secondary text
- Neutral 500: muted labels
- Neutral 300: dividers
- Neutral 200: soft stroke
- Neutral 100: panel background variation
- Neutral 50: page background

Purpose:
- text hierarchy
- cards
- table separation
- form fields
- layout rhythm

#### Background palette
Use layered but quiet backgrounds.

Recommended direction:
- App background: soft neutral light tone
- Panel background: clean white or near-white
- Elevated context area: subtle neutral contrast only
- Mobile task background: slightly stronger separation for fast readability

Rule:
- background changes must be subtle
- surfaces must separate information without creating visual noise

---

## 3. Typography System

### 3.1 Typography goals

Typography must prioritize:

- high readability
- fast scanning
- stable hierarchy
- reduced visual fatigue

The system should prefer modern, neutral sans-serif typography with clean numerals and strong readability in tables and forms.

### 3.2 Title hierarchy

Recommended hierarchy:

- Page Title: primary screen identity
- Section Title: major functional block inside the page
- Card Title: local content grouping
- Field Label: compact operational guidance
- Table Header: concise scan-oriented label

Rules:
- titles must be short and operationally explicit
- large headlines are for orientation, not decoration
- section headings must support scanning in dense work environments

### 3.3 Tables

Table typography must be:

- compact
- highly legible
- aligned for repeated scanning

Rules:
- use medium-weight headers
- avoid cramped line-height
- numeric columns must support fast alignment and comparison
- secondary metadata must be visually lighter than business-critical values

### 3.4 Forms

Form typography must be:

- simple
- instructional
- low-friction

Rules:
- field labels must be clear and stable
- helper text must be short and contextual
- validation text must be direct and non-verbose
- inferred values should be shown clearly without forcing re-entry

### 3.5 Dashboards

Dashboard typography must emphasize:

- action items
- risks
- queue priorities
- SLA and overdue visibility

Rules:
- large KPI typography should be used sparingly
- the most important dashboard text is usually the operational alert, not the decorative metric

---

## 4. Status System

### 4.1 Status design rules

Status must always combine:

- color
- label
- placement consistency
- non-color-only recognition

Use chips, badges, row highlights, icons, and clear wording together.

### 4.2 Operational status colors

Recommended direction:

- Waiting: muted amber
  - meaning: pending attention, queued, not yet started
- In Production: calm blue
  - meaning: active execution in progress
- Quality: muted violet or indigo
  - meaning: under review, inspection, validation
- Rework: burnt orange
  - meaning: corrective cycle, needs intervention
- Warranty: muted magenta or plum
  - meaning: after-delivery corrective responsibility
- Ready: teal-green
  - meaning: completed and ready for next operational step
- Delivered: neutral green-gray
  - meaning: closed/completed outcome

Rules:
- red should be reserved mainly for destructive actions, critical alerts, and blocking errors
- operational statuses must be distinguishable for color-blind users using labels and icons

### 4.3 Delivery type colors

Approved delivery types:

- Standard
- Priority
- Express

Recommended direction:

- Standard: neutral or muted blue-gray
- Priority: amber or orange accent
- Express: strong but controlled high-visibility blue-violet or deep orange accent

Rules:
- Express must be visibly prominent, but not visually aggressive across the whole interface
- delivery type indicators must be compact in tables and highly visible in operational print and execution screens

---

## 5. Grid Standards

### 5.1 Grid philosophy

Grids are core productivity surfaces.

They must support:

- rapid scanning
- low-noise comparison
- stable column rhythm
- filtering without clutter
- action access without opening every record

### 5.2 Standard grid behavior

All major grids should support:

- sorting where relevant
- fast search
- saved filters
- branch-aware context
- status chips
- keyboard-friendly row navigation
- density appropriate for long-session work

### 5.3 Service Order Grid standard

The Service Order Grid must support at least:

- Status
- Entry Date
- Delivery Date
- Customer
- Commercial Responsible
- Technical Responsible

Recommended supporting behavior:

- saved filters
- quick status filters
- branch context filter
- overdue visual emphasis
- delivery-type indicator
- direct open action

### 5.4 Grid composition rules

- avoid excessive row borders
- use whitespace and typographic hierarchy before heavy outlines
- sticky headers are recommended for long operational tables
- row emphasis should prioritize delayed, blocked, rework, warranty, and pending-delivery scenarios

---

## 6. Form Standards

### 6.1 Usability rules

The platform should automatically assist users.

Whenever possible, the interface must provide:

- autocomplete
- suggestions
- previous values
- contextual help

Rule:

- never force the user to type information that the platform can infer

Examples of inferable context:

- authenticated company
- active branch
- remembered branch
- recent customer selection
- known contact data
- recent product/service choices
- user role or community context

### 6.2 Contextual creation

Contextual creation must be standard behavior.

Example:

When creating a Service Order, if the Customer does not exist, the screen should allow:

- `[ + New Customer ]`

without leaving the Service Order screen.

The same principle should apply to:

- Customers
- Services
- Products
- Suppliers
- Employees

Rule:
- contextual creation should appear as an inline controlled expansion, modal, or side panel
- users should return to the original workflow with preserved data and context

### 6.3 Form composition rules

- group fields by operational meaning, not by database structure
- keep critical fields visible early
- collapse secondary fields when they are not required for the current action
- support keyboard-first completion for desktop-heavy users
- minimize modal overload and nested navigation

---

## 7. Dashboard Standards

### 7.1 Dashboard philosophy

Dashboards must answer one central question:

- What requires action now?

Dashboards must avoid excessive charts.

Charts are secondary.

Priority must be given to actionable work signals such as:

- Delayed Orders
- Rework
- Warranty
- Pending Deliveries
- Financial Alerts

### 7.2 Dashboard structure

Recommended structure:

- critical attention strip
- operational queues
- overdue and SLA blocks
- branch-aware summary cards
- secondary charts only when they support a real operational decision

### 7.3 Dashboard rules

- dashboards must not feel heavy
- the first screen should surface action, not decoration
- every key card should lead to a queue, list, or next action
- empty-state messaging should guide action, not just report absence

---

## 8. Mobile Standards

Operational mobile UX must prioritize:

- large buttons
- large touch areas
- QR-first workflow

Production and operational mobile screens must be:

- simple
- fast
- touch friendly

Operational Resources should complete tasks with minimal typing.

Large visual indicators must highlight:

- Due Date
- Priority
- Express Orders

### 8.1 Mobile rules
- one-hand operation should be feasible for core tasks
- primary actions must remain reachable without dense menus
- touch targets should support gloves, movement, and fast repetition where relevant
- status, due date, and priority must remain visible without scrolling through dense content
- Production Order screens must keep financial information hidden
- QR-first workflow should dominate mobile execution entry
- buttons and scan states must be obvious under operational pressure
- the fastest path should be scan -> confirm -> act -> record
- diary, execution, and status actions should favor taps, picks, and short input over long forms

### 8.2 Mobile content hierarchy
- task header first
- due date and urgency second
- action buttons third
- secondary metadata below the action layer

## 9. Smart Concierge Standards

Reception experience must be:

- fast
- friendly
- low friction

Customer lookup must support:

- Name
- Phone
- WhatsApp

Autocomplete must be enabled.

### 9.1 Concierge rules
- search must begin fast and tolerate partial information
- reception users should not navigate through back-office complexity
- arrival handling and retrieval support should emphasize next steps, not system internals
- queue state must be visually clear from distance when operating at a desk or counter

---

## 10. Accessibility Standards

ANEXSYS must support:

- Keyboard Navigation
- color-blind safe indicators
- WCAG principles

### 10.1 Accessibility rules
- never rely on color alone to communicate status, urgency, or permission state
- preserve sufficient contrast for text, chips, controls, and table states
- focus states must be highly visible
- keyboard navigation must support dense administrative workflows
- large touch targets must support mobile accessibility and operational speed together
- screen structure must remain predictable across channels

---

## 13. Final Product Experience Answer

ANEXSYS should feel like a calm, professional, modern operational workspace: more like a focused control system for continuous daily work than a cluttered legacy ERP or a decorative dashboard product.

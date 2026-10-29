# Reporting walkthrough example

These examples use real identifiers from the Airgoods notification reporting walkthrough.
They show selected paths, not a full table inventory. Verify the target code before reuse.

## Overview

The background job prepares reporting data. The API applies filters to that prepared data
when the user opens Health.

```mermaid
flowchart TB
  source[("📦 emails_sent<br/>user_notification<br/>order_master")]
  posthog["🦔 PostHog<br/>Activity and preference events"]
  refresh["🔜 NotificationReportRefreshService.refresh<br/>Prepare reporting data"]
  prepared[("📦 notification_report_receipt_summary<br/>notification_report_activity_summary")]
  api["🔌 getHealthEngagement<br/>Retailer activity and preferences"]
  ui["🖥️ Health<br/>Retailer reach and preference disables"]
  source -->|"Read source rows"| refresh
  posthog -->|"Export evidence"| refresh
  refresh -->|"Publish summaries"| prepared
  prepared -->|"Read selected dates and filters"| api
  api -->|"Return metrics"| ui
```

## Sequence

The job publishes reporting changes in one transaction. Dashboard reads during the rebuild
keep the previous complete revision.

```mermaid
sequenceDiagram
  participant UI as 🖥️ Health
  participant API as 🔌 getHealthEngagement
  participant Job as 🔜 NotificationReportRefreshService.refresh
  participant PostgreSQL@{ "type": "database" }
  participant PH as 🦔 PostHog

  Note over Job: Every 30 minutes in production, when enabled
  Job->>PostgreSQL: Save or resume notification_report_refresh_plan
  Job->>PH: Export the planned provider days
  PH-->>Job: Complete evidence
  Job->>PostgreSQL: Save notification_report_provider_stage
  Job->>PostgreSQL: BEGIN REPEATABLE READ
  Job->>PostgreSQL: Read eligible notification_report_change rows
  Job->>Job: Find affected historical periods
  Job->>PostgreSQL: Rebuild affected reporting tables

  UI->>API: Open Health
  API->>PostgreSQL: Read the previous published revision
  PostgreSQL-->>API: Prepared metrics and coverage
  API-->>UI: Display results

  Job->>PostgreSQL: COMMIT data, coverage and notification_report_publication<br/>Acknowledge exact changes and advance completed cursors
  Note over Job,PostgreSQL: On failure, roll back and retain the previous publication
```

This database participant syntax supports a cylinder without an alias. Renderer versions
differ in alias support. Check the visible label before combining aliases and database
types. Keep the symbol and `PostgreSQL` name if an icon alias is unsupported. Do not add
a grouping box to work around that limitation.

## Labels

Prefer `getHealthEngagement` with `Retailer activity and preferences` over a generic
`Reporting API` label. Prefer `notification_report_change` over a shortened `changes`
table name. An identifier explains what to inspect; the short label explains its role.

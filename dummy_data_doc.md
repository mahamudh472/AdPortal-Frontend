# Front-end Dummy Data Documentation

This document lists all properties and sections in the Admin Dashboard, User Management, and Organization Management pages that currently use front-end simulated/dummy data due to these fields not being returned by the backend API.

---

## 1. Admin Dashboard (`src/pages/admin/AdminDashboard/`)

### Stat Cards Trendlines & Waveforms
- **System Status Waveforms**:
  - The green heartbeat waveform icon (Lucide `Activity` pulse wave) on the right of the API Status, Database Status, and Active Campaigns cards is static visual decoration.

---

## 2. User Management (`src/pages/admin/UserManagement/`)

### Interactive Invite User Modal
- **API Gap**:
  - Submitting the form for "Invite User" currently simulates the addition of new items by injecting them directly into the React local state array (`setUsers`) rather than performing a POST request (which will be implemented later).

---

## 3. Finance Dashboard (`src/pages/admin/Finance/`)

### Stat Cards Trend Sparklines
- **API Gap**:
  - The backend only returns total transaction numbers and MRR/Monthly revenue values. It does not return data points for historical sparklines for individual cards.
- **Front-end Workaround**:
  - The far-right line graph sparklines inside the stats cards (Monthly Revenue, MRR Growth, Total Transactions, Failed Payments) are custom SVG paths rendered statically on the client.

### Payment Summary
- **API Gap**:
  - The API does not return a distinct breakdown of successful vs refunded vs failed payment values.
- **Front-end Workaround**:
  - The Donut chart and legend represent Successful as `monthly_revenue`, Failed as `failed_payments`, and Refunded as `0` to keep the UI dynamically linked.

### Upcoming Invoices
- **API Gap**:
  - No database table or API endpoint exists for upcoming invoices.
- **Front-end Workaround**:
  - Displays a clean visual empty state stating "No upcoming invoices / You're all caught up!".

---

## 4. Platform Analytics (`src/pages/admin/PlatformAnalytics/`)

### Stat Cards Trend Sparklines
- **API Gap**:
  - The API only returns total aggregate metrics for New/Active users. It does not return data points for sparklines.
- **Front-end Workaround**:
  - The far-right wave graph sparkline paths for "Total New Users" and "Avg. Active Users" cards are custom SVG paths. The "Most Used Feature" circular ring preview is styled as an SVG segment at `62.5%`.

### User Growth Summary (Concentric Ring Graphic)
- **API Gap**:
  - Concentric concentric circles vector representations do not exist in the database or api returns.
- **Front-end Workaround**:
  - Custom SVG graphics are drawn using vector nodes to yield concentric rings matching the required mockup metrics. Churned Users value (0) and trend percentages are simulated on the front-end.

---

## 5. Reports Dashboard (`src/pages/admin/AdminReport/`)

### Action Prompts
- **API Gap**:
  - Links under Weekly/Monthly/Custom report types ("Generate Now", "Create Custom") open simulated popup configurations. On submission, they POST to the backend report generator and insert the returned file into the react state.

---

## 6. User dashboard pages

Every user-dashboard page now loads its data from the backend. Where the backend cannot compute something yet it returns placeholder values marked `# TODO` in the code, so the frontend never hard-codes sample data.

| Page | Data | Backend status |
|---|---|---|
| Dashboard | platform cards, chart, top campaigns, AI insights, budget recommendation | Real data from `AnalysisDaily`. Demo campaigns / insights / recommendation are returned (TODO in `apps/main/utils/helper.py`) when the organization has none yet. |
| Campaigns | `ctr_trend`, `conversions_trend`, `roas_trend`, `sparkline_data` | Real (last 7 days vs previous 7). `null` trend shows "—". |
| Campaign details | Placements | Real spend share per platform (`placements`). |
| Analytics | stat cards + sparklines, performance chart (`range`), spend by platform, device chart, insight cards | Real. Device chart is empty until `device_breakdown` is populated by the sync tasks. |
| Reports | list, date range, status, search/type filter, insights sidebar | Real. |
| Reports | **Scheduled reports** | Stored and toggleable, but **no task generates them yet** (TODO on `ScheduledReport`). |
| AI Tools → Optimization | insights, settings (auto / mode / frequency), last optimization | Real (settings persisted per organization). |
| AI Tools → Optimization | `summary.applied_today`, `summary.est_savings`, `potential_impact`, `action_*`, **history list** | **Placeholder** — TODO in `apps/main/services/ai.py` / `AIInsightDetailSerializer`. "Optimize Now" only records the timestamp. |
| Subscriptions | plans, current plan, billing history, invoice download / ZIP | Real (Stripe invoice PDFs resolved on demand). |
| Team | members, joined / last active, stats | Real (`last_active_at` = last login). |
| Campaign wizard → Audience | Estimated reach | **Heuristic** from `POST /main/audience-reach-estimate/` — TODO: use platform reach-estimate APIs. |
| Campaign wizard → Review | Pre-launch checks, Publish | Real: checks are computed from the saved campaign + connected accounts; Publish calls `create-ad` with `draft: false`. |

Unused components `UserDashboard/SpendOverview` and `UserDashboard/RecentCampaigns` still contain sample deltas but are not rendered anywhere.

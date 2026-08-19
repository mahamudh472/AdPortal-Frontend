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

## 6. User Dashboard (`src/pages/Dashboard/UserDashboard/UserDashboard/`)

### Header Controls & Date Selector
- **API Gap**: Date range comparison filter (`May 1 – May 31, 2024`) and notification count badge (`3`) are client-side static indicators.

### Platform Spend Cards & Mini Sparklines
- **API Gap**:
  - The endpoint `GET /api/v1/main/dashboard/` returns `total_spend` but lacks platform-specific spend totals (Facebook `$4,230.55`, Google Ads `$3,215.45`, TikTok `$2,815.20`, Instagram `$1,245.30`), trend percentage comparisons (`+12.5%`, `+8.3%`, `+15.7%`, `+5.3%`, `+11.2%`), or historical sparkline arrays.
- **Front-end Workaround**:
  - Platform spend cards and SVG mini sparkline trend curves are rendered with static/fallback data.

### Performance Overview (Metrics & Multi-Line Chart)
- **API Gap**:
  - The backend does not return individual platform daily time-series data for chart rendering across Facebook, Google Ads, TikTok, and Instagram, nor does it return metric trends (`▲ 18.6%`, `▲ 16.3%`, etc.) or specific conversion/cost-per-conversion values.
- **Front-end Workaround**:
  - Rendered with Recharts using time-series points (`May 1` – `May 31`) and 5 metric summary chips (Impressions, Clicks, Conversions, Cost / Conv., ROAS).

### Top Campaigns Table
- **API Gap**:
  - `recent_campaigns` in backend payload does not include CTR, conversions count per campaign, or per-platform breakdown icons for top campaign listings.
- **Front-end Workaround**:
  - Renders top campaign rows formatted with spend, conversions, ROAS, CTR, and platform badges.

### AI Insights & Budget Recommendation
- **API Gap**:
  - AI insights from backend do not include confidence score percentages (`92%`, `78%`, `85%`), ROI impact projections (`+18% ROI`), or budget recommendation campaign models (`Summer Sale 2024`, `32% Better`, `+$1,250` impact).
- **Front-end Workaround**:
  - Visualized with custom AI Insight cards and Budget Recommendation donut gauge card.






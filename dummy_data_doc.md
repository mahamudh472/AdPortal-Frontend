# Front-end Dummy Data Documentation

This document lists all properties and sections in the Admin Dashboard, User Management, and Organization Management pages that currently use front-end simulated/dummy data due to these fields not being returned by the backend API.

---

## 1. Admin Dashboard (`src/pages/admin/AdminDashboard/`)

### Stat Cards Trendlines & Waveforms
- **Trend Values & Badges**:
  - The positive and neutral percentage badges (`+100%`, `0%`) and the inline SVG sparkline waveforms (rising trend for positive, flat trend for neutral) are computed on the client side based on simple ratio mappings of active counts.
- **System Status Waveforms**:
  - The green heartbeat waveform icon (Lucide `Activity` pulse wave) on the right of the API Status, Database Status, and Active Campaigns cards is static visual decoration.

### User Growth & Revenue Chart
- **Scale (14K Axes Ticks)**:
  - The chart displays values up to 14K for Users and Revenue. If the backend returns empty or incomplete arrays for `chart_data`, the front-end automatically falls back to a populated, high-fidelity Jan-Jul dataset to ensure the UI matches the required visualization.

---

## 2. User Management (`src/pages/admin/UserManagement/`)

### Stats Cards Trends
- **Active Users, Suspended, Trial Trends**:
  - The trend pills (`+ 12.5%`, `- 0%`, `+ 0%`) on the right side of the stats cards are front-end placeholders because the backend only returns raw current counts.

### User Roles
- **Roles Column & Dropdown Filters**:
  - The database does not explicitly store or return roles like "Owner" or "Manager" for all users. The front-end dynamically assigns roles (e.g. mapping specific emails like `info.mahmudh473@gmail.com` to "Owner" or checking `is_admin` to display "Admin") to match the mockup exactly.

---

## 3. Organization Management (`src/pages/admin/Organization/`)

### Stats Cards Row
- **API Gap**:
  - The `/admin/organizations/` endpoint only returns a list of organizations. It does not return any aggregate statistics.
- **Front-end Workaround**:
  - Total Organizations (8), Active (2), Suspended (0), Trial (0), and their trend percentages/badges are entirely simulated on the client side.

### Added On Column
- **API Gap**:
  - The `Organization` interface returned by the list endpoint lacks a `created_at` or `added_on` timestamp.
- **Front-end Workaround**:
  - Dates (e.g. `Apr 6, 2026`, `Apr 5, 2026`) are mapped on the client side based on the suffix of the Organization's `snowflake_id` or table row index to display a realistic chronology.

### Interactive Add Organization / Invite Modal
- **API Gap**:
  - Submitting the forms for "Add Organization" or "Invite User" currently simulates the addition of new items by injecting them directly into the React local state array (`setUsers` / `setOrganizations`) rather than performing a POST request (which will be implemented later).

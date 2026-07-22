# Backend API Changes Required

This document specifies all backend API modifications needed to eliminate the front-end dummy/simulated data documented in [`dummy_data_doc.md`](file:///home/mahmud/Projects/adportal_frontend/dummy_data_doc.md). Each section maps directly to a gap identified in that document and provides exact endpoint changes, new fields, new endpoints, and expected response schemas.

**Base URL:** `{VITE_API_BASE_URL}/api/v1`

---

## 1. Admin Dashboard — `/admin/dashboard`

### Current Response Schema

```json
{
  "users": {
    "value": 4,
    "past_month": 4,
    "percentage": "100.0"
  },
  "campaings": {
    "value": 6,
    "last_month": 6,
    "percentage": "100.0"
  },
  "revenue": {
    "value": 2600,
    "percentage": 0
  },
  "chart_data": [],
  "campaings_by_platform": { "meta": 3, "google": 2, "tiktok": 1 },
  "recent_campaigns": [...]
}
```

### Changes Required

#### 1.1 Trend Sparkline Data Points for Stat Cards

**Gap:** The trend badges (`+100%`, `0%`) and sparkline waveforms on stat cards are hardcoded on the front end.

**Change:** Add a `trend` sub-object to `users`, `campaings`, and `revenue` with historical data points for sparkline rendering.

```diff
  "users": {
    "value": 4,
    "past_month": 4,
-   "percentage": "100.0"
+   "percentage": "100.0",
+   "trend": {
+     "direction": "up",
+     "sparkline": [0, 1, 1, 2, 3, 4]
+   }
  },
  "campaings": {
    "value": 6,
    "last_month": 6,
-   "percentage": "100.0"
+   "percentage": "100.0",
+   "trend": {
+     "direction": "up",
+     "sparkline": [0, 1, 2, 3, 5, 6]
+   }
  },
  "revenue": {
    "value": 2600,
-   "percentage": 0
+   "percentage": 0,
+   "previous_month_value": 0,
+   "trend": {
+     "direction": "neutral",
+     "sparkline": [0, 0, 0, 0, 0, 2600]
+   }
  }
```

> **Implementation:** Query the last 6 monthly snapshots from the database (or compute them from `created_at` timestamps on users/campaigns/transactions) and return them as an array of integers.

#### 1.2 Populate `chart_data` from the Backend

**Gap:** When `chart_data` is empty, the front-end falls back to a hardcoded Jan–Jul dataset.

**Change:** Always return a populated `chart_data` array by aggregating user signups and revenue by month for the last 6–7 months.

```json
"chart_data": [
  { "month": "Jan", "users": 0, "revenue": 0 },
  { "month": "Feb", "users": 1, "revenue": 400 },
  { "month": "Mar", "users": 2, "revenue": 800 },
  { "month": "Apr", "users": 4, "revenue": 2600 },
  ...
]
```

> **Implementation:** `SELECT DATE_TRUNC('month', joined_at) AS month, COUNT(*) AS users FROM users GROUP BY month ORDER BY month` and similar for revenue from transactions.

#### 1.3 System Status (Optional Enhancement)

**Gap:** API Status, Database Status, and uptime values are hardcoded.

**Change (Low Priority):** Optionally add a `system_status` object:

```json
"system_status": {
  "api": { "status": "operational", "uptime_percent": 99.9 },
  "database": { "status": "operational", "uptime_percent": 100.0 }
}
```

> **Note:** This can be deferred. A simple health-check endpoint or a static response is sufficient for now.

---

## 2. User Management — `/admin/user-management/` & `/admin/user-management-list/`

### 2.1 Stats Trend Data

**Gap:** The trend pills (`+12.5%`, `-0%`, `+0%`) on Active Users, Suspended, and Trial cards are front-end placeholders.

**Current Response (`/admin/user-management/`):**

```json
{
  "total_users": { "value": 4, "last_week": 0 },
  "active_users": 2,
  "suspended_users": 0,
  "trial_users": 0
}
```

**Change:** Add trend data to each metric:

```diff
  {
    "total_users": {
      "value": 4,
-     "last_week": 0
+     "last_week": 0,
+     "trend_percentage": "+0%",
+     "trend_direction": "neutral"
    },
-   "active_users": 2,
+   "active_users": {
+     "value": 2,
+     "previous_period": 0,
+     "trend_percentage": "+100%",
+     "trend_direction": "up"
+   },
-   "suspended_users": 0,
+   "suspended_users": {
+     "value": 0,
+     "previous_period": 0,
+     "trend_percentage": "0%",
+     "trend_direction": "neutral"
+   },
-   "trial_users": 0
+   "trial_users": {
+     "value": 0,
+     "previous_period": 0,
+     "trend_percentage": "0%",
+     "trend_direction": "neutral"
+   }
  }
```

> **Implementation:** Compare counts from current week/month vs. the previous period using `joined_at` and `status` timestamps.

### 2.2 User Roles

**Gap:** Roles like "Owner", "Manager", "Member" are assigned via front-end email-matching heuristics. The API does not return an explicit `role` field.

**Change:** Add a `role` field to the `ApiUser` response from `/admin/user-management-list/`:

```diff
  {
    "id": "abc123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "status": "active",
    "last_login": "2026-04-18T10:00:00Z",
    "joined_at": "2026-04-06T09:00:00Z",
    "is_active": true,
    "is_suspended": false,
    "is_admin": false,
+   "role": "member",
    "subscription_tier": "growth",
    "campaigns_count": 3,
    "total_spend": 450.00
  }
```

**Valid `role` values:** `"owner"`, `"admin"`, `"manager"`, `"member"`

> **Implementation:** Add a `role` CharField (or enum) to the User model with choices. Migrate existing users: set `role="owner"` for organization creators, `role="admin"` for users where `is_admin=True`, and `role="member"` for everyone else.

**Database Migration:**

```python
# Migration
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('users', 'XXXX_previous')]

    operations = [
        migrations.AddField(
            model_name='user',
            name='role',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('owner', 'Owner'),
                    ('admin', 'Admin'),
                    ('manager', 'Manager'),
                    ('member', 'Member'),
                ],
                default='member',
            ),
        ),
    ]
```

---

## 3. Organization Management — `/admin/organizations/` - ✅ **Frontend Integrated**

**List Endpoint Query Parameters:** `GET /api/v1/admin/organizations/?search={search}&status={status}&page={page}&page_size={page_size}`

> Supports DRF pagination with dynamic `page` & `page_size` selector, string search, and `status` filtering (`active`, `suspended`, `trial`).

**Gap:** The list endpoint only returns organizations. No aggregate stats (Total, Active, Suspended, Trial counts or trends) exist.

**Change:** Create a **new endpoint** or extend the existing one.

#### Option A: New Endpoint (Recommended) - ✅ **Frontend Integrated**

**`GET /admin/organizations/stats/`**

```json
{
  "total_organizations": 8,
  "active_organizations": {
    "value": 2,
    "previous_period": 0,
    "trend_percentage": "+100%",
    "trend_direction": "up"
  },
  "suspended_organizations": {
    "value": 0,
    "previous_period": 0,
    "trend_percentage": "0%",
    "trend_direction": "neutral"
  },
  "trial_organizations": {
    "value": 0,
    "previous_period": 0,
    "trend_percentage": "0%",
    "trend_direction": "neutral"
  },
  "new_this_week": 0
}
```

> **Implementation:** `SELECT status, COUNT(*) FROM organizations GROUP BY status` and compare with previous-period snapshots.

### 3.2 `created_at` & `status` Fields on Organization - ✅ **Implemented in API & Frontend**

**Updated API Response (`GET /api/v1/admin/organizations/`):**

```json
{
    "count": 4,
    "next": null,
    "previous": null,
    "results": [
        {
            "snowflake_id": "7448491868293173248",
            "name": null,
            "website": null,
            "industry": null,
            "company_size": null,
            "created_at": "2026-04-10T22:07:27.688978Z",
            "status": "ACTIVE"
        }
    ]
}
```

> Both `created_at` and `status` are returned on each organization item in the list response. The frontend now parses `created_at` to display formatted dates and renders the `status` badge for each organization.


**Database Migration:**

```python
migrations.AddField(
    model_name='organization',
    name='status',
    field=models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('suspended', 'Suspended'),
            ('trial', 'Trial'),
        ],
        default='active',
    ),
),
```

### 3.4 Add Organization POST Endpoint

**Gap:** The "Add Organization" modal currently only injects into local React state. No POST endpoint exists.

**Change:** Create a **new endpoint**:

**`POST /admin/organizations/`**

**Request Body:**

```json
{
  "name": "New Organization",
  "website": "https://neworg.com",
  "industry": "Technology",
  "company_size": "1-10"
}
```

**Response (201 Created):**

```json
{
  "snowflake_id": "7445263800012345",
  "name": "New Organization",
  "website": "https://neworg.com",
  "industry": "Technology",
  "company_size": "1-10",
  "status": "active",
  "created_at": "2026-07-16T10:00:00Z"
}
```

### 3.5 Delete / Suspend Organization Endpoints - ✅ **Frontend Integrated**

**Endpoints:**

- **`PATCH /api/v1/admin/organizations/<str:snowflake_id>/`** — Update status (`"active"` / `"suspended"`)
- **`DELETE /api/v1/admin/organizations/<str:snowflake_id>/`** — Delete organization (Returns `204 No Content`)

> Frontend actions menu now dynamically toggles between Suspend and Activate based on current status and sends `DELETE` requests to remove organizations.


---

## 4. Finance Dashboard — `/admin/finance/`

### 4.1 Historical Sparkline Data for Stat Cards

**Gap:** The sparkline SVG paths on Monthly Revenue, MRR Growth, Total Transactions, and Failed Payments cards are static decorations.

**Change:** Add `sparkline` arrays to the finance response:

```diff
  {
    "monthly_revenue": 2600,
-   "mrr_growth": 0,
-   "total_transactions": 5,
-   "failed_payments": 0,
+   "mrr_growth": 0,
+   "total_transactions": 5,
+   "failed_payments": 0,
+   "sparklines": {
+     "monthly_revenue": [0, 0, 400, 800, 1200, 2600],
+     "mrr_growth": [0, 0, 0, 0, 0, 0],
+     "total_transactions": [0, 0, 1, 2, 3, 5],
+     "failed_payments": [0, 0, 0, 0, 0, 0]
+   },
    "revenue_overview": {...},
    "revenue_by_plan": {...}
  }
```

> **Implementation:** Aggregate each metric monthly over the last 6 months from the transactions table.

### 4.2 Payment Summary Breakdown

**Gap:** The API does not return a distinct breakdown of successful vs. refunded vs. failed payment values. The front end uses `monthly_revenue` as "Successful" and `failed_payments` (count) as "Failed", with "Refunded" hardcoded to `$0`.

**Change:** Add a `payment_summary` object:

```diff
  {
    ...
+   "payment_summary": {
+     "successful": { "count": 5, "total": 2600.00 },
+     "failed": { "count": 0, "total": 0.00 },
+     "refunded": { "count": 0, "total": 0.00 }
+   },
    "revenue_overview": {...}
  }
```

> **Implementation:** `SELECT status, COUNT(*), SUM(amount) FROM transactions GROUP BY status`

### 4.3 Upcoming Invoices Endpoint

**Gap:** No database table or API endpoint exists for upcoming invoices.

**Change:** Create a **new endpoint**:

**`GET /admin/invoices/upcoming/`**

```json
{
  "count": 0,
  "results": [
    {
      "id": 1,
      "organization": "Org Name",
      "amount": 399.00,
      "due_date": "2026-05-01",
      "plan": "Growth",
      "status": "pending"
    }
  ]
}
```

> **Implementation:** Either integrate with Stripe's upcoming invoices API (`stripe.Invoice.upcoming()`) or build a local invoices table that tracks subscription renewal dates.

**Database Model (if local):**

```python
class Invoice(models.Model):
    organization = models.ForeignKey('Organization', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    plan = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 5. Platform Analytics — `/admin/platform-analysis/`

### 5.1 Aggregate Stats with Trends

**Gap:** The API only returns raw `user_growth` and `feature_usage` arrays. Stats like "Total New Users" and "Avg. Active Users" are computed on the front end without trend comparisons. Trend percentages (`+100%`, `+87.5%`) are hardcoded.

**Change:** Add a `summary` object:

```diff
  {
    "user_growth": [...],
    "feature_usage": [...],
+   "summary": {
+     "total_new_users": {
+       "value": 12,
+       "previous_period": 0,
+       "trend_percentage": "+100.0%",
+       "trend_direction": "up",
+       "sparkline": [0, 1, 2, 3, 3, 3]
+     },
+     "avg_active_users": {
+       "value": 3,
+       "previous_period": 0,
+       "trend_percentage": "+100.0%",
+       "trend_direction": "up",
+       "sparkline": [0, 1, 2, 2, 3, 3]
+     },
+     "churned_users": {
+       "value": 0,
+       "previous_period": 0,
+       "trend_percentage": "0%",
+       "trend_direction": "neutral"
+     },
+     "most_used_feature": {
+       "name": "Campaign Creation",
+       "usage_percent": 62.5
+     }
+   }
  }
```

### 5.2 User Growth Summary Data

**Gap:** The concentric ring graphic values (New Users, Active Users, Churned Users) and their trend percentages are simulated on the front end.

**Change:** The `summary.churned_users` field above covers this. Additionally, ensure the `active_users` value in the latest month of `user_growth` is accurate (currently the front end takes `userGrowthData[length-1].activeUsers` and applies a hardcoded `+87.5%` trend).

> **Implementation:** Track churned users by comparing active users between periods. A user is "churned" if they were active in the previous period but not in the current one. Return this as a computed field.

---

## 6. Reports — `/admin/reports/` & `/admin/generate-report/`

### 6.1 Report Metadata (Size, Downloads, Generated By)

**Gap:** The `ApiReport` response lacks `size`, `download_count`, and `generated_by` fields. These are simulated on the front end using ID-based heuristics.

**Change:** Extend the `ApiReport` serializer:

```diff
  {
    "id": 1,
    "name": "weekly_report_2026_04_20.xlsx",
    "created_at": "2026-04-20T10:00:00Z",
    "report_type": "weekly",
    "status": "COMPLETED",
    "included_metrics": ["revenue_overview", "user_growth"],
    "start_date": "2026-04-20",
    "end_date": "2026-04-26",
-   "file": "https://storage.example.com/reports/weekly_report.xlsx"
+   "file": "https://storage.example.com/reports/weekly_report.xlsx",
+   "file_size_bytes": 2568192,
+   "download_count": 3,
+   "generated_by": {
+     "id": "user-abc",
+     "email": "admin@example.com",
+     "name": "Admin"
+   }
  }
```

**Database Migration:**

```python
migrations.AddField(
    model_name='report',
    name='file_size_bytes',
    field=models.BigIntegerField(null=True, blank=True),
),
migrations.AddField(
    model_name='report',
    name='download_count',
    field=models.IntegerField(default=0),
),
migrations.AddField(
    model_name='report',
    name='generated_by',
    field=models.ForeignKey(
        'users.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='generated_reports'
    ),
),
```

> **Implementation:**
> - `file_size_bytes`: Calculate from the generated file and store at creation time.
> - `download_count`: Increment via a `POST /admin/reports/{id}/download/` endpoint or middleware tracking.
> - `generated_by`: Set to `request.user` when the report is created via `/admin/generate-report/`.

### 6.2 Report Download Tracking

**Change:** Create a **new endpoint** to track downloads and increment the counter:

**`POST /admin/reports/{id}/download/`**

**Response (200):**

```json
{
  "download_url": "https://storage.example.com/reports/weekly_report.xlsx",
  "download_count": 4
}
```

> **Implementation:** Increment `download_count` and return the file URL. The front end should call this instead of directly fetching the file URL.

---

## Summary of All Changes

### Modified Endpoints

| Endpoint | Change Type | Fields Added |
|---|---|---|
| `GET /admin/dashboard` | Extend response | `users.trend`, `campaings.trend`, `revenue.trend`, `revenue.previous_month_value`, always-populated `chart_data` |
| `GET /admin/user-management/` | Restructure stats | `active_users.{value,previous_period,trend_*}`, same for `suspended_users`, `trial_users` |
| `GET /admin/user-management-list/` | Extend user object | `role` field on each user |
| `GET /admin/organizations/` | Extend org object | `created_at`, `status` on each organization |
| `GET /admin/finance/` | Extend response | `sparklines`, `payment_summary` |
| `GET /admin/platform-analysis/` | Extend response | `summary` object with aggregated stats & trends |
| `GET /admin/reports/` | Extend report object | `file_size_bytes`, `download_count`, `generated_by` |

### New Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/admin/organizations/stats/` | `GET` | Aggregate organization statistics with trends |
| `/admin/organizations/` | `POST` | Create a new organization |
| `/admin/organizations/{id}/` | `PATCH` | Update organization (e.g., suspend) |
| `/admin/organizations/{id}/` | `DELETE` | Delete an organization |
| `/admin/invoices/upcoming/` | `GET` | List upcoming invoices |
| `/admin/reports/{id}/download/` | `POST` | Track report download and return file URL |

### New Database Fields

| Model | Field | Type | Default |
|---|---|---|---|
| `User` | `role` | `CharField(max_length=20)` | `"member"` |
| `Organization` | `created_at` | `DateTimeField(auto_now_add=True)` | — |
| `Organization` | `status` | `CharField(max_length=20)` | `"active"` |
| `Report` | `file_size_bytes` | `BigIntegerField(null=True)` | `null` |
| `Report` | `download_count` | `IntegerField` | `0` |
| `Report` | `generated_by` | `ForeignKey(User, null=True)` | `null` |

### New Database Models

| Model | Purpose |
|---|---|
| `Invoice` | Track upcoming and historical invoices (organization, amount, due_date, plan, status) |

---

## Implementation Priority

### Phase 1 — High Impact, Low Effort
1. **Organization `created_at`** — Likely already in DB, just not serialized
2. **User `role` field** — Simple CharField addition + migration
3. **Organization `status` field** — Simple CharField + migration
4. **Organization CRUD endpoints** (POST, PATCH, DELETE)

### Phase 2 — Medium Impact, Medium Effort
5. **User management trend stats** — Requires period-over-period queries
6. **Organization stats endpoint** — New endpoint with aggregation
7. **Report metadata** (`file_size_bytes`, `download_count`, `generated_by`)
8. **Finance payment summary** — SQL aggregation by transaction status

### Phase 3 — High Impact, Higher Effort
9. **Dashboard chart_data population** — Monthly aggregation queries
10. **Dashboard & Finance sparkline arrays** — Historical time-series computation
11. **Platform analytics summary + trends** — Aggregation + period comparison
12. **Upcoming invoices** — New model + possible Stripe integration

---

## Notes for Backend Developers

1. **Backward Compatibility:** All changes should be additive (new fields alongside existing ones). The front end already handles missing fields gracefully with fallbacks, so partial deployments are safe.

2. **Trend Calculation Formula:**
   ```
   trend_percentage = ((current - previous) / previous) * 100  if previous > 0
   trend_percentage = "+100%"                                   if previous == 0 and current > 0
   trend_percentage = "0%"                                      if previous == 0 and current == 0
   ```

3. **Sparkline Arrays:** Should contain 6 data points representing the last 6 months (or weeks, depending on context). Values should be integers or floats representing the metric's absolute value for that period.

4. **API Versioning:** All changes target `/api/v1/`. If breaking changes are needed (like restructuring `active_users` from int to object), consider deploying behind a feature flag or creating `/api/v2/` variants.

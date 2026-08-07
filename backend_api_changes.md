# Backend API Changes Required

This document specifies all backend API modifications needed to eliminate the front-end dummy/simulated data documented in [`dummy_data_doc.md`](file:///home/mahmud/Projects/adportal_frontend/dummy_data_doc.md). Each section maps directly to a gap identified in that document and provides exact endpoint changes, new fields, new endpoints, and expected response schemas.

**Base URL:** `{VITE_API_BASE_URL}/api/v1`

---

## 1. Finance Dashboard — `/admin/finance/`

### 1.1 Historical Sparkline Data for Stat Cards

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

### 1.2 Payment Summary Breakdown

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

### 1.3 Upcoming Invoices Endpoint

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

## 2. Platform Analytics — `/admin/platform-analysis/`

### 2.1 Aggregate Stats with Trends

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

### 2.2 User Growth Summary Data

**Gap:** The concentric ring graphic values (New Users, Active Users, Churned Users) and their trend percentages are simulated on the front end.

**Change:** The `summary.churned_users` field above covers this. Additionally, ensure the `active_users` value in the latest month of `user_growth` is accurate (currently the front end takes `userGrowthData[length-1].activeUsers` and applies a hardcoded `+87.5%` trend).

> **Implementation:** Track churned users by comparing active users between periods. A user is "churned" if they were active in the previous period but not in the current one. Return this as a computed field.

---

## Summary of Remaining Changes

### Modified Endpoints

| Endpoint | Change Type | Fields Added |
|---|---|---|
| `GET /admin/finance/` | Extend response | `sparklines`, `payment_summary` |
| `GET /admin/platform-analysis/` | Extend response | `summary` object with aggregated stats & trends |

### New Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/admin/invoices/upcoming/` | `GET` | List upcoming invoices |

### New Database Models

| Model | Purpose |
|---|---|
| `Invoice` | Track upcoming and historical invoices (organization, amount, due_date, plan, status) |

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

4. **API Versioning:** All changes target `/api/v1/`. If breaking changes are needed, consider deploying behind a feature flag or creating `/api/v2/` variants.

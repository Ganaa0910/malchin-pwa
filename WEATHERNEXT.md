# WeatherNext 2 setup

The weather screen pulls live forecasts from **WeatherNext 2** (Google DeepMind).
WeatherNext 2 is **not a REST weather API** — it ships as a BigQuery dataset you
subscribe to, then query from your own GCP project. This app queries it server-side
(`/api/weather`) and maps the 6-hourly grid forecast into the app's daily shape.

Until it's configured, the app falls back to seeded/offline weather automatically,
so nothing breaks. Set the env vars below to flip it live — no code changes needed.

Docs: https://developers.google.com/weathernext/guides/bigquery

---

## 1. GCP prerequisites

1. Create or pick a project at https://console.cloud.google.com — note its **Project ID**
   (the ID, not the display name).
2. **Enable billing** on the project. BigQuery's free tier (~1 TB queries/month)
   covers this app's tiny query.
3. Enable the **BigQuery API** (console search bar → "BigQuery API" → Enable).

## 2. Subscribe to the WeatherNext 2 dataset

4. On the [BigQuery guide page](https://developers.google.com/weathernext/guides/bigquery),
   fill out the **WeatherNext Data Request form** and submit. Wait for access.
5. Once granted, open the **WeatherNext 2 Forecasts** listing in **Analytics Hub**
   (linked from the same guide page).
6. Click **"Add dataset to project."**
7. Choose:
   - **Project** → your project from step 1
   - **Dataset name** → e.g. `weathernext`  *(remember this — it's an env var)*
8. Your table is now addressable as:
   ```
   your-project-id.weathernext.weathernext_2_0_0_mean
   ```
   (`_mean` = deterministic mean. Other variants: `weathernext_2_0_0` for ensembles.)

## 3. Create credentials

9. Console → **IAM & Admin → Service Accounts → Create service account.**
10. Grant it two roles: **BigQuery Job User** + **BigQuery Data Viewer.**
11. Open the service account → **Keys → Add key → Create new key → JSON.**
    A `.json` key file downloads. Keep it private.

## 4. Configure the app

12. In the repo root:
    ```bash
    cp .env.example .env.local
    ```
13. Fill in `.env.local`:

    | Variable | Value |
    |---|---|
    | `GOOGLE_CLOUD_PROJECT` | your Project ID (step 1) |
    | `WEATHERNEXT_DATASET` | the dataset name you chose (step 7, e.g. `weathernext`) |
    | `WEATHERNEXT_TABLE` | `weathernext_2_0_0_mean` |
    | `WEATHERNEXT_LOCATION` | `US` |
    | `GOOGLE_CLOUD_CREDENTIALS` | the **entire JSON key file on one line** |

14. Restart the dev server:
    ```bash
    npm run dev
    ```
    The Weather tab's source label flips from "Офлайн өгөгдөл" to **"WeatherNext 2."**

> `.env.local` is gitignored — never commit the service-account key.
> On Vercel, add the same variables under **Project → Settings → Environment Variables.**

## 5. Verify the schema once

The exact column names are only visible after you subscribe. Confirm they match
what the code expects (`COLS` in `src/lib/weather/weathernext.ts`). Run this in the
BigQuery console:

```sql
SELECT column_name, data_type
FROM `YOUR-PROJECT.weathernext`.INFORMATION_SCHEMA.COLUMNS
WHERE table_name = 'weathernext_2_0_0_mean';
```

If any field differs (e.g. the nested `forecast` struct or a variable name),
update the `COLS` object at the top of `src/lib/weather/weathernext.ts` — it's the
single place column names live.

## Troubleshooting

- **`/api/weather` returns 503 `weathernext_not_configured`** → an env var is missing.
  All of `GOOGLE_CLOUD_PROJECT`, `WEATHERNEXT_DATASET`, and credentials must be set.
- **`/api/weather` returns 503 `weathernext_query_failed`** → the query ran but failed.
  Check the dev-server terminal for the BigQuery error. Most common cause is a
  column-name mismatch (fix `COLS`) or the service account missing a role.
- **Permission denied** → the service account needs **BigQuery Job User** (to run
  queries) *and* **BigQuery Data Viewer** (to read the dataset).
- **Weather still shows offline** → restart the dev server after editing `.env.local`;
  Next only reads env vars at boot.

## How it maps to the app

- `2m_temperature` (K) → °C
- `10m_u/v_component_of_wind` (m/s) → km/h wind speed
- `total_precipitation_6hr` (m) → mm; sub-zero precip is approximated to snow (~7:1)
- **Dzud risk** is derived from 3-day snow total, cold nights (≤ −10°C), and high wind.

The deterministic `_mean` table exposes precipitation, not snowfall. If you later use
a table with a real snow field, tell me and the snow approximation can be swapped for
the direct value.

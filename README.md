# REBNY Catalog Anonymization & Data Pipeline (Tasks 5–11)

This repository contains the complete anonymization pipeline designed to scrub StreetEasy/third-party data and prepare NYC listings for direct REBNY (Real Estate Board of New York) live feed registration.

---

## 📌 Pipeline Overview

Across all **2,786 published listings** (`is_published = 1`):

* **Tasks 1–4 (Handled upstream):**
  1. Remove "PH" from titles/units.
  2. Modest unit number shift.
  3. Modest street number shift.
  4. Price shift up/down by 10%–20%.

* **Tasks 5–11 (Handled in this repository):**
  * **Task 5 (20 Architectural Templates in Round-Robin):** Replaces all agent text across `overview`, `frontend_overview`, `tts_clean_overview`, and `tts_clean_overview_html` with 20 distinct NYC architectural styles rotated round-robin.
  * **Task 6 (Dynamic Price Deciles):** Evaluates listings dynamically across 10 price deciles using active/fuzzed prices.
  * **Task 7 (10 Architectural Profiles & Prompts):** Complete Midjourney/Flux prompt specifications for AI stock generation.
  * **Task 8 (Room-Scaled BunnyCDN Stock Photos):** Assigns non-repeating images matching bedroom counts (Studios = 3 photos; 1BR = 4 photos; 2BR = 5 photos; 3BR = 6 photos; 4BR+ = 7 photos).
  * **Task 9 (Fictional Broker & Agent Personas):** Replaces Compass, Corcoran, Elliman, etc., in `properties_agents_info` with 10 rotating in-house agent personas under `Renby Residential`.
  * **Task 11 (Voiceover Sync & Scraped MP3 Nulling):** Syncs TTS text in `properties_voice_over` and nullifies legacy `audio_url` and `voice_over_url` so old scraped broker audio is never broadcasted.

* **Pending Verification:**
  * **Task 10:** Geolocation lat/long jitter (`properties_geo_locations`).
  * **Task 12:** Clear `source_url` and rebuild `slug` (`properties`).

---

## 📂 Repository Contents

```text
.
├── graphic_designer_10_tier_prompts.md  # 10-tier architectural guide & Midjourney prompts
├── templates.js                         # 20 distinct NYC architectural templates
├── run_full_batch_5_to_8.js             # Main pipeline batch runner (dry-run & live)
├── setup_test_bunny_pool.js             # Test placeholder image generator for BunnyCDN
├── test_tasks_5_to_8.js                 # Verification script across sample price tiers
├── .env.example                         # Environment configuration template
└── package.json                         # Node dependencies (mysql2, dotenv)
```

---

## 📊 Dynamic Price Deciles (Tiers 1–10)

| Tier | Price Range | Typology & Architecture |
| :---: | :--- | :--- |
| **Tier 1** | $\le \$500,000$ | Modest outer-borough / Upper Manhattan post-war co-ops and studios |
| **Tier 2** | $\$500,000 \text{ -- } \$650,000$ | Established 1BR co-ops & renovated pre-war apartments |
| **Tier 3** | $\$650,000 \text{ -- } \$850,000$ | Junior-4 & classic 1BR doorman residences (UES, Harlem, LIC) |
| **Tier 4** | $\$850,000 \text{ -- } \$1,150,000$ | Boutique new development starter 2BRs & high-end 1BR condos |
| **Tier 5** | $\$1,150,000 \text{ -- } \$1,500,000$ | Prime 2BR pre-war & full-service condominium residences |
| **Tier 6** | $\$1,500,000 \text{ -- } \$2,000,000$ | Prime Manhattan 2BR/2BA luxury condos (Chelsea, Flatiron) |
| **Tier 7** | $\$2,000,000 \text{ -- } \$2,900,000$ | High-floor luxury 3BR residences & SoHo cast-iron lofts |
| **Tier 8** | $\$2,900,000 \text{ -- } \$4,450,000$ | Penthouse residences with terraces & full-floor lofts |
| **Tier 9** | $\$4,450,000 \text{ -- } \$8,000,000$ | Ultra-luxury full-floor Park Ave / Billionaires' Row homes |
| **Tier 10** | $\$8,000,000 \text{ -- } \$128,000,000$ | Landmark mega-penthouses & trophy limestone townhouses |

---

## 🚀 Running the Pipeline

### 1. Dry Run Simulation (Default — ZERO DB writes)
Simulates processing on the target REBNY Clone DB without modifying any data:
```bash
node run_full_batch_5_to_8.js --dry-run --target=clone --table=main --limit=10
```

### 2. Live Execution on REBNY Clone DB (`renby.systemstar.com:3310`)
Executes full live update across `properties`, `properties_images`, `properties_agents_info`, and `properties_voice_over`:
```bash
node run_full_batch_5_to_8.js --execute --target=clone --table=main --pool=prod
```

---

## ⚙️ CLI Flags Reference

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--dry-run` | `true` | Simulation mode. Logs tier, template, agent, and photo assignments without writing. |
| `--execute` | `false` | Required to perform mutating database updates. |
| `--target=` | `dev` | Target database connection: `dev` (`dev-db.heatfleet.com:3306`) or `clone` (`renby.systemstar.com:3310`). |
| `--table=` | `backup` | Target tables: `backup` (`*_backup`) or `main` (`properties`, `properties_images`, etc.). |
| `--pool=` | `test` | Image pool: `test` (`/generic_stock_test/`) or `prod` (`/generic_stock/`). |
| `--limit=N` | `null` | Process only the first $N$ listings for testing. |

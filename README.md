# REBNY Catalog Anonymization & Data Pipeline (Tasks 5–8)

This repository contains the scripts, decile segmentation logic, architectural prompt profiles, and database migration tooling designed to anonymize NYC listing data for Real Estate Board of New York (REBNY) live data registration.

---

## 📌 Project Overview

To qualify for direct REBNY live feed integration, all previously scraped StreetEasy/third-party data must be replaced with neutral, non-infringing synthetic catalog data across all **2,786 published listings** (`is_published = 1`).

The workflow is split across 8 tasks:
* **Tasks 1–4 (Handled upstream):**
  1. Remove all "PH" (Penthouse) references from titles/slugs/units.
  2. Modestly shift unit numbers.
  3. Modestly shift street numbers.
  4. Adjust listing prices up/down by 10%–20%.
* **Tasks 5–8 (This repository):**
  * **Task 6: 10 Price Partitions (Deciles):** Segments published listings into 10 clean tiers based on NYC price distributions.
  * **Task 7: 10 Architectural Tier Profiles & Image Generation Prompts:** Comprehensive architectural and finish specifications for generating 10–20 AI interior stock images per room category.
  * **Task 8: Room-Based Stock Image Assignment:** Assigns tier-appropriate, non-repeating stock images from BunnyCDN (`living_room`, `kitchen`, `bedroom(s)`, `bathroom`) based on property bedroom counts.
  * **Task 5: Description & Derived Voiceover Rewriting:** Programmatically synthesizes original NYC luxury marketing copy and cleans voiceover fields (`overview`, `frontend_overview`, `tts_clean_overview`, `tts_clean_overview_html`) with zero broker or third-party remnants.

---

## 📂 Repository Contents

```text
.
├── graphic_designer_10_tier_prompts.md  # Complete 10-tier architectural guide & Midjourney prompts
├── run_full_batch_5_to_8.js             # Main production batch script (dry-run & live execution)
├── setup_test_bunny_pool.js             # Generates & uploads 80 test images to BunnyCDN
├── test_tasks_5_to_8.js                 # Verification runner across price tiers
├── .env.example                         # Environment configuration template
└── package.json                         # Node dependencies (mysql2, dotenv)
```

---

## 📊 Price Partitions (Deciles for 2,786 Published Listings)

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

## 🛠️ Quickstart & Prerequisites

### 1. Requirements
* Node.js `v18.0.0+` (tested on `v22.17.0`)
* MySQL server access (Development Sandbox or REBNY Clone DB)

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/Coden-inja/dummy-renby58.git
cd dummy-renby58

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

Fill in `.env` with your database and BunnyCDN credentials.

---

## 🚀 Running the Pipeline

All tasks are executed via `run_full_batch_5_to_8.js`.

### 1. Safe Dry Run (No Database Writes)
Simulates processing on 5 listings to verify tier assignment, room image sampling, and copy generation:
```bash
node run_full_batch_5_to_8.js --dry-run --limit=5
```

### 2. Test Execution on Sandbox / Backup Tables (`dev-db.heatfleet.com`)
Runs live updates against `properties_backup` and `properties_images_backup`:

```bash
# Test on 10 listings
node run_full_batch_5_to_8.js --execute --table=backup --target=dev --limit=10

# Run full batch on all 2,786 listings in sandbox
node run_full_batch_5_to_8.js --execute --table=backup --target=dev
```

### 3. Production Run on REBNY Clone DB (`renby.systemstar.com:3310`)
Once Tasks 1–4 are applied and the final stock image set is uploaded:

```bash
# 1. First dry-run on clone DB to inspect
node run_full_batch_5_to_8.js --dry-run --target=clone --pool=prod

# 2. Execute live update on clone DB
node run_full_batch_5_to_8.js --execute --table=main --target=clone --pool=prod
```

---

## ⚙️ CLI Flags Reference

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--dry-run` | `true` | Runs simulation without executing any `INSERT` or `UPDATE` queries. |
| `--execute` | `false` | Required to perform mutating database updates. |
| `--target=` | `dev` | Target database connection: `dev` (`dev-db.heatfleet.com:3306`) or `clone` (`renby.systemstar.com:3310`). |
| `--table=` | `backup` | Target tables: `backup` (`properties_backup`, `properties_images_backup`) or `main` (`properties`, `properties_images`). |
| `--pool=` | `test` | Image pool: `test` (`/generic_stock_test/`) or `prod` (`/generic_stock/`). |
| `--limit=N` | `null` | Process only the first $N$ listings for testing. |

---

## 🎨 Stock Image Storage & Upload Format

Final generated images must be uploaded to BunnyCDN Storage in the following structure:
```text
https://hunter-pull-1.b-cdn.net/generic_stock/
├── tier_01/
│   ├── living_room/ (img_01.webp ... img_20.webp)
│   ├── kitchen/     (img_01.webp ... img_20.webp)
│   ├── bedroom/     (img_01.webp ... img_20.webp)
│   └── bathroom/    (img_01.webp ... img_20.webp)
├── tier_02/
...
└── tier_10/
```
Refer to `graphic_designer_10_tier_prompts.md` for detailed room-by-room architectural prompts.

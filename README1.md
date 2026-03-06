# 🌱 AgriPulse

**AI-Powered Soil Nutrient Analyzer** — Know your soil, feed your crop, grow more.

AgriPulse lets farmers and agronomists upload a soil test CSV, pick a target crop, and instantly receive suitability scores, health classifications, fertilizer recommendations, and plain-English AI explanations — all running locally in the browser with no backend required.

---

## ✨ Features

- 📂 **CSV Upload** — drag-and-drop or click to upload soil test data
- 🌾 **4 Supported Crops** — Tomato 🍅, Wheat 🌾, Rice 🌾, Maize 🌽
- 📊 **Suitability Scoring** — 0–100 score per soil sample based on nutrients and pH
- 🏥 **Health Classification** — Healthy (≥ 80) · Deficient (50–79) · Critical (< 50)
- 💊 **Fertilizer Recommendations** — Urea, DAP, MOP suggested per deficiency
- 🤖 **AI Explanation** — human-readable per-sample narrative with pH and nutrient detail
- ⬇️ **Export** — download results as CSV or JSON
- 🔄 **Live Re-analysis** — switch crop without re-uploading

---

## 🖥️ Pages

| Route | Description |
|---|---|
| `/` | How-to-use guide and app introduction |
| `/upload` | CSV upload and validation |
| `/analysis` | Results dashboard with filters and export |
| `/reference` | Scoring guide, nutrient thresholds, crop pH ranges |

---

## 📋 CSV Format

Your file must include these **five columns** (case-insensitive):

| Column | Type | Example |
|---|---|---|
| `soil_id` | string | `S-001` |
| `nitrogen` | number (mg/kg) | `45` |
| `phosphorus` | number (mg/kg) | `20` |
| `potassium` | number (mg/kg) | `180` |
| `ph` | number | `6.5` |

**Example CSV:**
```csv
soil_id,nitrogen,phosphorus,potassium,ph
S-001,45,20,180,6.5
S-002,10,8,90,4.2
S-003,80,35,320,7.0
```

---

## 🧪 Scoring Logic

Each sample starts at **100 points**. Deductions are applied as follows:

| Condition | Deduction |
|---|---|
| pH outside crop's ideal range | −20 |
| Each nutrient below threshold | −15 |
| Crop-specific critical nutrient below limit | −10 |

**Nutrient thresholds:** Nitrogen < 20 · Phosphorus < 15 · Potassium < 150

**Crop-specific critical rules:**

| Crop | Critical Nutrient | Limit |
|---|---|---|
| Tomato | Potassium | < 200 |
| Wheat | Nitrogen | < 30 |
| Rice | Phosphorus | < 25 |
| Maize | Nitrogen | < 35 |

---

## 🚀 Getting Started

**Prerequisites:** Node.js 18+ and npm

```sh## 🛠️ Tech Stack

| Tool | Purpose |
|---|---|
| [React 18](https://react.dev) | UI framework |
| [Vite](https://vitejs.dev) | Build tool & dev server |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [shadcn/ui](https://ui.shadcn.com) | Component library |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [React Router](https://reactrouter.com) | Client-side routing |
| [PapaParse](https://www.papaparse.com) | CSV parsing |
| [Vitest](https://vitest.dev) | Unit testing |

---

## 🧪 Running Tests

```sh
npm test              # run once
npm run test:watch    # watch mode
```

The test suite (`src/test/smoke.test.ts`) covers:
- Static config validation for all 4 crops
- `analyzeRow` return shape and field correctness
- Health classification (Healthy / Deficient / Critical)
- Nutrient deficiency detection and values
- Fertilizer recommendation text
- AI explanation content
- pH boundary conditions
- Crop-specific critical rule deductions
- `overall_health` map correctness

---

## 📁 Project Structure

```
src/
├── components/         # Navbar, NavLink, ResultCard, shadcn/ui components
├── hooks/              # use-mobile, use-toast
├── lib/
│   └── soilAnalysis.ts # Core analysis logic (scoring, classification, recommendations)
├── pages/
│   ├── HowToUse.tsx    # Landing / guide page
│   ├── UploadPage.tsx  # CSV upload + validation
│   ├── AnalysisPage.tsx# Results dashboard
│   ├── Reference.tsx   # Scoring & threshold reference
│   └── NotFound.tsx    # 404 page
└── test/
    ├── smoke.test.ts   # Full smoke test suite
    └── setup.ts        # Vitest setup (jsdom + jest-dom)
```
- Edit files directly within the Codespace and commit and push your changes once you're done.
